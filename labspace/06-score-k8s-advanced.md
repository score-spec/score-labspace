# Advanced scenario with `score-k8s`

The `score-k8s` implementation CLI provides more options to enrich the default `manifests.yaml` file generated in order to support more native Kubernetes features.

## `--format yaml|kyaml`

Export the `manifests.yaml` as [`kyaml`](https://kubernetes.io/docs/reference/encodings/kyaml/) instead of default `yaml`:
```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --format kyaml
```

See the new format of the generated :fileLink[`manifests.yaml`]{path="manifests.yaml" line="17"} file.

## `--override-property`

Override any properties of the Score file imperatively:
```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Kubernetes!"
```

See the new `MESSAGE` value in the generated :fileLink[`manifests.yaml`]{path="manifests.yaml" line="216"} file.

## `--namespace`

Set the `namespace` field for the generated Kubernetes resources:
```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --namespace test
```

See the new `namespace` field in the generated :fileLink[`manifests.yaml`]{path="manifests.yaml" line="190"} file.

## `--generate-namespace`

Generate a `Namespace` Kubernetes resource:
```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --namespace test \
    --generate-namespace
```

See the new `Namespace` resource in the generated :fileLink[`manifests.yaml`]{path="manifests.yaml" line="3"} file.

## `--patch-templates`

Override the default content and any fields of the `manifests.yaml` with the patch template feature:

```bash
echo '{{ range $i, $m := .Manifests }}
{{ if eq $m.kind "Deployment" }}
- op: set
  path: {{ $i }}.spec.template.spec.automountServiceAccountToken
  value: false
- op: set
  path: {{ $i }}.spec.template.spec.securityContext
  value:
    fsGroup: 65532
    runAsGroup: 65532
    runAsNonRoot: true
    runAsUser: 65532
    seccompProfile:
      type: "RuntimeDefault"
{{ range $cname, $_ := $m.spec.template.spec.containers }}
- op: set
  path: {{ $i }}.spec.template.spec.containers.{{ $cname }}.securityContext
  value:
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    capabilities:
      drop:
        - ALL
{{ end }}
{{ end }}
{{ end }}' | score-k8s init --patch-templates -
```

In this example, this inlined snippet patches all the Workloads and sets the `securityContext` fields.

```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest
```

See the associated new fields and values in the generated :fileLink[`manifests.yaml`]{path="manifests.yaml" line="223"} file.

Instead of using the inlined format, you can use `--patch-templates` with local or external files (Https, Git, OCI), like this:
```bash
score-k8s init \
    --patch-templates https://raw.githubusercontent.com/score-spec/community-patchers/refs/heads/main/score-k8s/unprivileged.tpl \
    --patch-templates https://raw.githubusercontent.com/score-spec/community-patchers/refs/heads/main/score-k8s/service-account.tpl
```

In this example above, in addition to set the `securityContext` with this [`unprivileged.tpl` patch template file](https://docs.score.dev/examples/patch-templates/score-k8s/unprivileged/), we are also using a second [`service-account.tpl` patch template file](https://docs.score.dev/examples/patch-templates/score-k8s/service-account/) to create a dedicated `ServiceAccount` resource per `Deployment`.

## Provisioners

```bash
score-k8s init \
    --provisioners https://raw.githubusercontent.com/score-spec/community-provisioners/refs/heads/main/route/score-k8s/10-shared-gateway-httproute.provisioners.yaml
```

```bash
score-k8s generate score.yaml
```

```bash
kubectl apply -f manifests.yaml
```

## Resources

- [`score-k8s` CLI](https://docs.score.dev/docs/score-implementation/score-compose/cli/)
- [Patch templates](https://docs.score.dev/docs/score-implementation/score-k8s/patch-templates/)
- [Patch templates examples Hub](https://docs.score.dev/examples/patch-templates?implementation=score-k8s)