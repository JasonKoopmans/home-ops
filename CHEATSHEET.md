

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
