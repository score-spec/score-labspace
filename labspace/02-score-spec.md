# Score specification

First and foremost, Score is a Specification.

The Score Specification is a YAML file that contains the following top-level reference definitions.

The simplest Score file is:
```yaml
apiVersion: score.dev/v1b1
metadata:
  name: my-workload
containers:
  my-container:
    image: .
```

But let's look at a more realistic workload, a :fileLink[public service talking to a PostgreSQL database]{path="score.yaml"}:
```yaml save-as=score.yaml
apiVersion: score.dev/v1b1
metadata:
  name: hello-world
  annotations:
    tags: "nodejs,http,website,javascript"
containers:
  hello-world:
    image: .
    variables:
      PORT: "3000"
      MESSAGE: "Hello, World!"
      DB_DATABASE: ${resources.db.name}
      DB_USER: ${resources.db.username}
      DB_PASSWORD: ${resources.db.password}
      DB_HOST: ${resources.db.host}
      DB_PORT: ${resources.db.port}
resources:
  db:
    type: postgres
  dns:
    type: dns
  route:
    type: route
    params:
      host: ${resources.dns.host}
      path: /
      port: 8080
service:
  ports:
    www:
      port: 8080
      targetPort: 3000
```

## Resources

- [Score specification reference](https://docs.score.dev/docs/score-specification/score-spec-reference/)