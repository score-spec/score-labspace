# Prerequisites

```bash
rm README.md
git clone https://github.com/score-spec/sample-score-app .
```

```bash
mkdir tmp
cd tmp
```

```bash
SCORE_COMPOSE_VERSION=$(curl -sL https://api.github.com/repos/score-spec/score-compose/releases/latest | jq -r .tag_name)
wget https://github.com/score-spec/score-compose/releases/download/${SCORE_COMPOSE_VERSION}/score-compose_${SCORE_COMPOSE_VERSION}_linux_amd64.tar.gz
tar -xvf score-compose_${SCORE_COMPOSE_VERSION}_linux_amd64.tar.gz
chmod +x score-compose
sudo mv score-compose /usr/local/bin
```

```bash
SCORE_K8S_VERSION=$(curl -sL https://api.github.com/repos/score-spec/score-k8s/releases/latest | jq -r .tag_name)
wget https://github.com/score-spec/score-k8s/releases/download/${SCORE_K8S_VERSION}/score-k8s_${SCORE_K8S_VERSION}_linux_amd64.tar.gz
tar -xvf score-k8s_${SCORE_K8S_VERSION}_linux_amd64.tar.gz
chmod +x score-k8s
sudo mv score-k8s /usr/local/bin
```

```bash
cd ..
rm -rf tmp
```

```bash
score-compose version
score-k8s version
```

```bash
KIND_VERSION=$(curl -sL https://api.github.com/repos/kubernetes-sigs/kind/releases/latest | jq -r .tag_name)
curl -Lo ./kind https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

```bash
sudo ./scripts/setup-kind-cluster.sh
```