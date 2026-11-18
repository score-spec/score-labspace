# syntax=docker/dockerfile:1.7
#
# Content overlay of the Score Labspace on Docker Sandboxes. Same result as the
# workspace setup script in compose.override.yaml, done at build time:
#   - the lab's instructions and the sample app land where the Labspace kit
#     looks for them (/opt/labspace/content/{labspace,project}),
#   - the tools the lab uses land in /usr/local/bin.

FROM alpine:3.22 AS build
ARG TARGETARCH
RUN apk add --no-cache curl git

# Resolve the latest release tag from the GitHub redirect instead of the GitHub
# API, to avoid hitting the unauthenticated API rate limit.
RUN <<'EOF'
set -eux
latest_tag() {
  basename "$(curl -fsSLo /dev/null -w '%{url_effective}' "https://github.com/$1/releases/latest")"
}
mkdir -p /out/usr/local/bin /tmp/dl
cd /tmp/dl

for tool in score-compose score-k8s; do
  version=$(latest_tag "score-spec/${tool}")
  curl -fsSL "https://github.com/score-spec/${tool}/releases/download/${version}/${tool}_${version}_linux_${TARGETARCH}.tar.gz" | tar -xz "${tool}"
  install -m 0755 "${tool}" /out/usr/local/bin/
done

version=$(latest_tag kubernetes-sigs/kind)
mkdir -p /out/usr/local/lib/score-labspace
curl -fsSLo /out/usr/local/lib/score-labspace/kind "https://kind.sigs.k8s.io/dl/${version}/kind-linux-${TARGETARCH}"

version=$(curl -fsSL https://dl.k8s.io/release/stable.txt)
curl -fsSLo /out/usr/local/bin/kubectl "https://dl.k8s.io/release/${version}/bin/linux/${TARGETARCH}/kubectl"

version=$(latest_tag helm/helm)
curl -fsSL "https://get.helm.sh/helm-${version}-linux-${TARGETARCH}.tar.gz" | tar -xz --strip-components=1 "linux-${TARGETARCH}/helm"
install -m 0755 helm /out/usr/local/bin/

chmod 0755 /out/usr/local/bin/* /out/usr/local/lib/score-labspace/*
EOF

# `kind` wrapper. The sandbox's proxy intercepts the TLS connections to Docker
# Hub with its own CA (/usr/local/share/ca-certificates/proxy-ca.crt), which
# the sandbox trusts but the Kind nodes don't: their containerd fails to pull
# images from Docker Hub (x509: certificate signed by unknown authority).
# After `kind create cluster`, add that CA to every node, restart containerd,
# and wait for the nodes to be ready.
COPY --chmod=0755 <<'EOF' /out/usr/local/bin/kind
#!/bin/sh
set -e
/usr/local/lib/score-labspace/kind "$@"
[ "$1" = "create" ] && [ "$2" = "cluster" ] || exit 0
ca=/usr/local/share/ca-certificates/proxy-ca.crt
[ -f "$ca" ] || exit 0
for cluster in $(/usr/local/lib/score-labspace/kind get clusters 2>/dev/null); do
  for node in $(/usr/local/lib/score-labspace/kind get nodes --name "$cluster"); do
    docker cp "$ca" "$node:/usr/local/share/ca-certificates/sbx-proxy-ca.crt"
    docker exec "$node" sh -c 'update-ca-certificates >/dev/null 2>&1; systemctl restart containerd'
  done
done
kubectl wait nodes --all --for=condition=Ready --timeout=180s >/dev/null
EOF

# The sample app is the project the learner works on.
RUN <<'EOF'
set -eux
project=/out/opt/labspace/content/project
git clone https://github.com/score-spec/sample-score-app "$project"
mkdir -p "$project/.vscode"
cat > "$project/.vscode/settings.json" <<JSON
{
  "yaml.schemas": {
    "https://raw.githubusercontent.com/score-spec/spec/main/score-v1b1.json": ["score.yaml", "*.score.yaml"]
  },
  "redhat.telemetry.enabled": false
}
JSON
echo ".vscode/" >> "$project/.git/info/exclude"
chown -R 1000:1000 "$project"
EOF

FROM scratch
COPY --from=build /out /
COPY labspace /opt/labspace/content/labspace
