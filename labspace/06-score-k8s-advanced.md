# More advanced with `score-k8s`

## `--override-property`

```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Kubernetes!"
```

```bash
kubectl apply -f manifests.yaml
```

## `--namespace` and `--generate-namespace`

```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Kubernetes!" \
    --namespace test \
    --generate-namespace
```

```bash
kubectl apply -f manifests.yaml
```

## `--patch-templates`

```bash
score-k8s init \
    --patch-templates https://raw.githubusercontent.com/score-spec/community-patchers/refs/heads/main/score-k8s/unprivileged.tpl
```

```bash
score-k8s generate score.yaml \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Kubernetes!" \
    --namespace test \
    --generate-namespace
```

```bash
kubectl apply -f manifests.yaml
```

## Provisioners

```bash
score-k8s init \
    --provisioners https://raw.githubusercontent.com/score-spec/community-provisioners/refs/heads/main/route/score-k8s/10-shared-gateway-httproute.provisioners.yaml \
    --patch-templates https://raw.githubusercontent.com/score-spec/community-patchers/refs/heads/main/score-k8s/unprivileged.tpl
```

```bash
score-k8s generate score.yaml \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Kubernetes!" \
    --namespace test \
    --generate-namespace
```

```bash
kubectl apply -f manifests.yaml
```