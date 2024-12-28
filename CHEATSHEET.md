

### How to create and consume Secrets

> The toolchain I have in this repo looks for *.sops.* named files for secrets to encrypt in place.  You can used kubectl to new this up and generate the yaml for it.  Then write it to the local filesystem in place.


[Reference](https://www.thorsten-hans.com/encrypt-your-kubernetes-secrets-with-mozilla-sops/)

```
kubectl create secret generic backend-secrets \
    --from-literal username=secret_value \
    --from-literal password=othersecret_value \
    -o yaml \
    --dry-run=client > secret.sops.yml
```

#### Encrypting
Run this command before committing
`task sops:encypt`

#### Utilizing and referencing the secrets
When Accessing from an environment variable:
[Reference](https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/#define-container-environment-variables-with-data-from-multiple-secrets)


```
apiVersion: v1
kind: Pod
metadata:
  name: envvars-multiple-secrets
spec:
  containers:
  - name: envars-test-container
    image: nginx
    env:
    - name: BACKEND_USERNAME
      valueFrom:
        secretKeyRef:
          name: backend-secrets
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: backend-secrets
          key: password
```

# Variabile Substitution in Flux 

In my local workflow I'm often doing something from my workstation that looks like this:

- Create a manifest
- `task flux:apply path=app/name`
- if the manifests include variable substitutions, the apply would fail, and I'd need to hardcode something in
- (wonder) ...how does the Kustomize Controller reconcile this when it's reconning the whole repo ...?
- before committing, switch back to using the variable substitution

To overcome that, I've added references in the ks.yaml file (FluxCDs Kustomization) that look like this:

```
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: &app cilium
  namespace: flux-system
spec:
  targetNamespace: kube-system
  commonMetadata:
    labels:
      app.kubernetes.io/name: *app
  path: ./kubernetes/apps/kube-system/cilium/app
  prune: false # never should be deleted
  sourceRef:
    kind: GitRepository
    name: home-kubernetes
  ## HERE's an Example of how to get Variable substitution right
  postBuild:
    substituteFrom:
      - kind: ConfigMap
        name: cluster-settings 
      - kind: Secret
        name: cluster-secrets
  wait: false
  interval: 30m
  retryInterval: 1m
  timeout: 5m
```

The most important part is 

```
  postBuild:
    substituteFrom:
      - kind: ConfigMap
        name: cluster-settings 
      - kind: Secret
        name: cluster-secrets
```

Which applies substitutions from this kustomization from a base configmap that's defined for the cluster.  

More information can be found here: [PostBuild Variable substitution](https://fluxcd.io/flux/components/kustomize/kustomizations/#post-build-variable-substitution)


# Storage

## Creating local ephemeral storage

// TODO //


## Working with NFS

The nfs-subdir-external-provisioner is installed and configured here ./kubernetes/apps/storage/nfs-subdir-external-provisioner

This controller allows for the straightforward provisioning on an existing NFS server for PVCs and for consuming applications to jsut simply have these volumes:
- be created dynamically
- be referenced from any node, and even shared across nodes
- persist beyond deployment, pod, and note lifecycles

This is important when workloads need:
- portability to be scheduled on any worker node, and to have survivability
- when the complexity of exotic replicated storage is more squeeze than the relative performance of those subsystems
- We want things to persist without "trying realy hard"

I followed pretty typical methods available on their readme to installed it -- leveraging the HelmRelease option.  To do that in this repo, I needed to:

- Create a `HelmRepository` here: ./kubernetes/flux/repositories/helm/nfs-subdir-external-provisioner.yaml
- Add a reference to the new asset in the kustomization file for the HelmRepos
- Create an 'app' in the flux system for the Controller's HelmRelease
  - Adding the HelmRepo
  - Adding a reference to the kustomization file to add the Release
- Pushed the assets using `task flux:apply path=...`

### To use the controller to provision folders

Create a PVC that resembles:

```
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  ==name: nfs-pvc==
  namespace: default
spec:
  storageClassName: nfs-provision
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Mi
```
The operative element is the use of the storageClassName: `nfs-provision` which the controller watches and creates folders for according to a defined spec.

A deployment would look pretty typical that consumes the pvc

```
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: alpine-nfs-deployment
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: alpine-nfs
  template:
    metadata:
      labels:
        app: alpine-nfs
    spec:
      containers:
      - name: alpine-container
        image: alpine:latest
        command: ["/bin/sh", "-c", "while true; do echo 'NFS storage is working' > /mnt/nfs/test.txt; sleep 10; done"]
        volumeMounts:
        - mountPath: /mnt/nfs
          name: nfs-volume
      volumes:
      - name: nfs-volume
        persistentVolumeClaim:
          ==claimName: nfs-pvc==

```


# Testing a MYSQL Server

```
kubectl run mysql-client --image=mysql:5.7 -it --rm --restart=Never -- /bin/bash

mysql -h mysql-service -uroot -proot_password -e 'SHOW databases;'

OR

mysql -h mysql-service -uroot -proot_password
```

### Getting the list of users from a MYSQL Database
`SELECT user FROM mysql. user;`

### Copying data from one PVC to another

https://github.com/utkuozdemir/pv-migrate


### Setting up VolSync

Some Learnings:
- The docs suggest that the Clone, Snapshot, and external Snapshot provisioner are needed.  They are for some features.  I've opted now to use the direct copy method, which doesn't seem to need those features.  I didn't provision the external snapshot provisioner
- When the restic caches are provisioned, they seem to want to be provisioned as RWX, and the default class as if this writing (December 2024) is a local hostpath provisioner.  Right now, the only volumes that would seem to support that are the `nfs-provision` ones, and that's how I have the jobs configured.  That seems to mean that we wind up (at least) quadripling the storage use:
  - PVC
  - Backup Cache
  - S3 storage
  - Restore Cache
  - Restore PVC
- Because we're doing direct use of the running pvc, it's probably prone to partial writes.  That shouldn't be a big deal except in cases where we're doing heavy alters.  The MySQL operator can do it's own backup and restore, and this can concentrate more on performing backups to the file based assets and SQLDumps.  
- Until I feel really confident, I'll probably define the recovery method right in the folder of the application and utilize a technique where I'm newing up a restore pvc (nfs provisioned likely) and either using tools outside k8s to hand-craft the recovery -- which is convenient for volumes on the nfs server.  
- There is the capability to have volume populators which appear to work with the restic mover, which would set up a recovery option where if the app got nuked, or needed to move it could get the initial state from a Replication repo -- with set recovery times.  

#### Diagnosing Problems with Volsync

Opening K9s and Looking at the ReplicationSource and ReplicationDestination resources is a good starting place.  They give some good high level diagnosis.  After that, looking for pods that have "volsync" in their names are good next areas to check.  For the former, accessing the Description for the resource itself is a good start, for the later, accessing the logs will have more detail if the description on the pod isn't useful.  