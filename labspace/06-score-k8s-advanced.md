# Advanced scenario with `score-k8s`

The `score-k8s` implementation CLI provides more options to enrich the default `manifests.yaml` file generated in order to support more native Kubernetes features.

## `--format yaml|kyaml`

Export the `manifests.yaml` as [`kyaml`](https://kubernetes.io/docs/reference/encodings/kyaml/) instead of default `yaml`:
```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --format kyaml
```

See the new format of the generated :fileLink[`manifests.yaml`]{path="manifests.yaml"} file.

## `--override-property`

Override any properties of the Score file imperatively:
```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest \
    --override-property containers.hello-world.variables.MESSAGE="Hello, Kubernetes!"
```

See the new `MESSAGE` value in the generated :fileLink[`manifests.yaml`]{path="manifests.yaml" line="216"} file.

Deploy the updated Kubernetes manifests to update the workload with its new `MESSAGE`:
```bash
sudo kubectl apply -f manifests.yaml
```

Wait for the new version of the workload to be rolled out:
```bash
sudo kubectl rollout status deployment/hello-world --timeout=120s
```

Test the deployed workload and see the updated line "`<h1>Hello, Kubernetes!</h1>`":
```bash
curl --fail --retry 30 --retry-delay 2 --retry-all-errors $(score-k8s resources get-outputs dns.default#hello-world.dns --format '{{ .host }}:80')
```

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

In this example, this inlined snippet is a [Go template](https://pkg.go.dev/text/template) looping over all the generated manifests, and for each `Deployment`, setting the `automountServiceAccountToken` and `securityContext` fields.

Like with `score-compose`, the patch template is now stored in the `.score-k8s` local state and will be applied on every subsequent `score-k8s generate`.

```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest
```

See the associated new fields and values in the generated :fileLink[`manifests.yaml`]{path="manifests.yaml" line="223"} file.

Deploy the patched workload and wait for it to be rolled out:
```bash
sudo kubectl apply -f manifests.yaml
sudo kubectl rollout status deployment/hello-world --timeout=120s
```

Check the `securityContext` now applied to the running pod:
```bash
sudo kubectl get pods -l app.kubernetes.io/name=hello-world \
    -o jsonpath='{.items[0].spec.containers[0].securityContext}' | jq
```

And the application still works:
```bash
curl --fail --retry 30 --retry-delay 2 --retry-all-errors $(score-k8s resources get-outputs dns.default#hello-world.dns --format '{{ .host }}:80')
```

Instead of using the inlined format, you can use `--patch-templates` with local or external files (Https, Git, OCI), like this:
```bash
score-k8s init \
    --patch-templates https://raw.githubusercontent.com/score-spec/community-patchers/refs/heads/main/score-k8s/unprivileged.tpl \
    --patch-templates https://raw.githubusercontent.com/score-spec/community-patchers/refs/heads/main/score-k8s/service-account.tpl
```

In this example above, in addition to set the `securityContext` with this [`unprivileged.tpl`](https://docs.score.dev/examples/patch-templates/score-k8s/unprivileged/) patch template file (the same as the inlined snippet you used above), we are also using a second [`service-account.tpl`](https://docs.score.dev/examples/patch-templates/score-k8s/service-account/) patch template file to create a dedicated `ServiceAccount` resource per `Deployment`.

Regenerate the manifests:
```bash
score-k8s generate score.yaml \
    --image scorespec/sample-score-app:latest
```

See the new `serviceAccountName` field and the new `ServiceAccount` resource at the end of the generated :fileLink[`manifests.yaml`]{path="manifests.yaml" line="237"} file.

## Provisioners

Resource provisioners are the way to define how Platform Engineers want to implement actual resource types defined in the Score file by the Developers.

In the example used so far, see this :fileLink[score.yaml]{path="score.yaml" line="17"} file, the resource types requested are `postgres`, `dns` and `route`.

The `score-k8s init` command writes the default pre-defined resource types provisioners in the `.score-k8s` local state.

See the list of available resource types:
```bash
score-k8s provisioners list -f json | jq -r .[].Type
```

See the actual definitions of these resource provisioners here: :fileLink[zz-default.provisioners.yaml]{path=".score-k8s/zz-default.provisioners.yaml"}.

You can use these default pre-defined resource types provisioners or you may want to bring your own definitions more specialized for your context and own needs.

To experiment with this, we will reset the local state. But first, delete the resources currently deployed in the cluster: the `.score-k8s` directory holds the identity of the provisioned resources (generated names, passwords, labels, ...), deleting it means brand new resources will be generated, and some of them (like the `Deployment`'s selector) can't be updated in place.
```bash
sudo kubectl delete -f manifests.yaml --ignore-not-found --cascade=foreground
```

_Note: The `--cascade=foreground` flag makes the command wait until the pods are actually deleted, not only their `Deployment` and `StatefulSet`._

You can skip the default provisioners by using the `--no-default-provisioners` option:
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
Error: failed to provision resources: resource 'dns.default#hello-world.dns' is not supported by any provisioner. Please implement a custom resource provisioner to support this resource type.
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
Error: failed to provision resources: resource 'postgres.default#hello-world.db' is not supported by any provisioner. Please implement a custom resource provisioner to support this resource type.
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

Like with `score-compose`, your own provisioners take precedence over the ones in the `zz-default.provisioners.yaml` file, loaded last.

Regenerate the `manifests.yaml` file accordingly and see that we don't have any error anymore:
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

Deploy the workload with its new resources and wait for the pods to be ready:
```bash
sudo kubectl apply -f manifests.yaml
sudo kubectl wait pods --all --for=condition=Ready --timeout=180s
```

See the `HTTPRoute` now using the `localhost` hostname coming from your own `dns` provisioner:
```bash
sudo kubectl get httproute
```

Test the deployed workload:
```bash
curl --fail --retry 30 --retry-delay 2 --retry-all-errors localhost:80
```

_Note: Here again, the Developer's `score.yaml` file didn't change at all, only the platform side (the provisioners) did._

## Resources

- [`score-k8s` CLI](https://docs.score.dev/docs/score-implementation/score-k8s/cli/)
- [Patch templates](https://docs.score.dev/docs/score-implementation/score-k8s/patch-templates/)
- [Patch templates examples Hub](https://docs.score.dev/examples/patch-templates?implementation=score-k8s)
- [Resource provisioners](https://docs.score.dev/docs/score-implementation/score-k8s/resources-provisioners/)
- [Resource provisioners examples Hub](https://docs.score.dev/examples/resource-provisioners?implementation=score-k8s)
