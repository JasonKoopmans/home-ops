

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