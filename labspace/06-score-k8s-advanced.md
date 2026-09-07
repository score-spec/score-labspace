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

In this example above, in addition to set the `securityContext` with this [`unprivileged.tpl`](https://docs.score.dev/examples/patch-templates/score-k8s/unprivileged/) patch template file, we are also using a second [`service-account.tpl`](https://docs.score.dev/examples/patch-templates/score-k8s/service-account/) patch template file to create a dedicated `ServiceAccount` resource per `Deployment`.

## Provisioners

Resource provisioners are the way to define how Platform Engineers want to implement actual resource types defined in the Score file by the Developers.

In the example used so far, see this :fileLink[score.yaml]{path="score.yaml" line="17"} file, the resource types requested are `postgres`, `dns` and `route`.

The `score-k8s init` downloads the default pre-defined resource types provisioners.

See the list of available resource types:
```bash
score-k8s provisioners list -f json | jq -r .[].Type
```

See the actual definitions of these resource provisioners here: :fileLink[zz-default.provisioners.yaml]{path=".score-k8s/zz-default.provisioners.yaml"}.

This is a best practice to not use the default pre-defined resource types provisioners and bring your own definitions. You can skip the download of the default provisioners by using the `--no-default-provisioners` option:
```bash
rm -rf .score-k8s
score-k8s init --no-default-provisioners
```

From this, if you try to generate the `manifests.yaml` file from the `score.yaml` file, you will get the errors mentioning that the resource types don't have any resource provisioners defined:
```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest
```

```none
Error: failed to provision: resource 'dns.default#hello-world.dns' is not supported by any provisioner
```

Bring your own `dns` resource provisioner:
```bash
score-k8s init --no-default-provisioners --provisioners=- <<EOF
- uri: template://custom-dns
  type: dns
  description: Outputs a localhost domain as the hostname.
  outputs: |
    host: localhost
  expected_outputs:
    - host
EOF
```

Regenerate the `manifests.yaml` file accordingly and see that the `dns` provisioner error is gone, the next error will be about `postgres`:
```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest
```

```none
Error: failed to provision: resource 'postgres.default#hello-world.db' is not supported by any provisioner
```

Validate the resource types supported at this stage:
```bash
score-k8s provisioners list
```

Bring back the default resource provisioners to fix the `postgres` and `route` resource types errors as well as bringing our own `dns` resource provisioner to override the default one:
```bash
rm -rf .score-k8s
score-k8s init --provisioners=- <<EOF
- uri: template://custom-dns
  type: dns
  description: Outputs a localhost domain as the hostname.
  outputs: |
    host: localhost
  expected_outputs:
    - host
EOF
```

Validate the resource types supported now:
```bash
score-k8s provisioners list
```

Regenerate the `manifests.yaml` file accordingly and see that we don't any error anymore:
```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest
```

See the actual `outputs` generated by the associated resource types used:
```bash
score-k8s resources list 
```

```none
+---------------------------------+------------------------------------------------+
|               UID               |                    OUTPUTS                     |
+---------------------------------+------------------------------------------------+
| dns.default#hello-world.dns     | host                                           |
+---------------------------------+------------------------------------------------+
| postgres.default#hello-world.db | database, host, name, password, port, username |
+---------------------------------+------------------------------------------------+
| route.default#hello-world.route |                                                |
+---------------------------------+------------------------------------------------+
```

## Resources

- [`score-k8s` CLI](https://docs.score.dev/docs/score-implementation/score-k8s/cli/)
- [Patch templates](https://docs.score.dev/docs/score-implementation/score-k8s/patch-templates/)
- [Patch templates examples Hub](https://docs.score.dev/examples/patch-templates?implementation=score-k8s)
- [Resource provisioners](https://docs.score.dev/docs/score-implementation/score-k8s/resources-provisioners/)
- [Resource provisioners examples Hub](https://docs.score.dev/examples/resource-provisioners?implementation=score-k8s)
