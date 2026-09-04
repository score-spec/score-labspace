# Score specification

First and foremost, Score is a Specification.

The Score Specification is what Developers will use to describe in a YAML file what their workload needs when someone later will deploy it somewhere.

## Simple Score file

The simplest Score file that you can have is:
```yaml
apiVersion: score.dev/v1b1
metadata:
  name: my-workload
containers:
  my-container:
    image: .
```

This is defining that the workload `my-workload` has one container `my-container`, and at this stage the container image name is not known (`.`) and will be supplied later in the CI/CD workflow.

_Note: it's not a Kubernetes Custom Resource._

## More complex Score file

Now here is a more realistic workload definition, a public service talking to a PostgreSQL database (:fileLink[score.yaml]{path="score.yaml"}):
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