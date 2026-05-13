# Terraform-Infrastruktur

Dokumentation der AWS-Ressourcen, die aktuell von `terraform/` verwaltet werden.
Der State liegt remote im S3-Bucket `bs-101010110` (Key `terraform.tfstate`, Region `us-east-1`).

## Netzwerkarchitektur

VPC `10.1.0.0/16`, verteilt über die ersten drei Availability Zones der konfigurierten Region (Default `us-east-1`). Jede AZ erhält je ein öffentliches und ein privates `/24`-Subnetz. Öffentliche Subnetze routen `0.0.0.0/0` über ein Internet Gateway; private Subnetze haben aktuell keinen Egress (kein NAT Gateway).

```mermaid
flowchart TB
    subgraph AWS["AWS-Account (us-east-1)"]
        IGW["aws_internet_gateway.main"]

        subgraph VPC["aws_vpc.main &mdash; 10.1.0.0/16"]
            subgraph RT["Route Tables"]
                RTPub["aws_route_table.public<br/>0.0.0.0/0 → IGW"]
                RTPriv["aws_route_table.private<br/>(keine Egress-Route)"]
            end

            subgraph AZ1["AZ #1"]
                PubA["öffentliches Subnetz<br/>10.1.0.0/24"]
                PrivA["privates Subnetz<br/>10.1.3.0/24"]
            end
            subgraph AZ2["AZ #2"]
                PubB["öffentliches Subnetz<br/>10.1.1.0/24"]
                PrivB["privates Subnetz<br/>10.1.4.0/24"]
            end
            subgraph AZ3["AZ #3"]
                PubC["öffentliches Subnetz<br/>10.1.2.0/24"]
                PrivC["privates Subnetz<br/>10.1.5.0/24"]
            end
        end
    end

    Internet((Internet)) <--> IGW
    IGW --- VPC
    PubA -. zugeordnet .-> RTPub
    PubB -. zugeordnet .-> RTPub
    PubC -. zugeordnet .-> RTPub
    PrivA -. zugeordnet .-> RTPriv
    PrivB -. zugeordnet .-> RTPriv
    PrivC -. zugeordnet .-> RTPriv
```

> Die CIDRs werden mit `cidrsubnet(var.vpc_cidr, 8, i)` berechnet — öffentlich nutzt die Indizes 0–2, privat die Indizes 3–5.

## Container Registry

Eine einzelne ECR-Repository, benannt nach `var.app_name` (Default `quiz-app`), mit veränderbaren Tags und einer Lifecycle Policy, die nur die fünf neuesten Images behält.

```mermaid
flowchart LR
    Repo["aws_ecr_repository.app_ecr_repo<br/>name = var.app_name<br/>image_tag_mutability = MUTABLE<br/>force_delete = true"]
    LP["aws_ecr_lifecycle_policy.app<br/>behält die 5 neuesten Images"]
    Repo --> LP

    OutName(["Output: ecr_repository_name"])
    OutUrl(["Output: ecr_repository_url"])
    Repo --> OutName
    Repo --> OutUrl
```

## Load Balancer und Security Groups

Ein öffentlich erreichbarer Application Load Balancer in den drei öffentlichen Subnetzen terminiert HTTP auf Port 80 und leitet an eine IP-basierte Target Group weiter, die direkt die ENIs der Fargate-Tasks adressiert. Zwei Security Groups bilden eine Zwei-Schichten-Trennung: Der ALB nimmt Traffic aus dem Internet an, die App-SG akzeptiert nur Verkehr vom ALB auf dem Container-Port.

```mermaid
flowchart LR
    Internet((Internet))

    subgraph VPCblk["aws_vpc.main (öffentliche Subnetze)"]
        ALB["aws_lb.app<br/>application LB<br/>internal = false<br/>subnets = aws_subnet.public[*]"]
        Listener["aws_lb_listener.http<br/>port 80 / HTTP<br/>default_action: forward"]
        TG["aws_lb_target_group.app<br/>port = var.container_port (3000)<br/>protocol = HTTP<br/>target_type = ip<br/>Health: GET /api/health"]
    end

    SGalb["aws_security_group.alb<br/>Ingress: 80/tcp ← 0.0.0.0/0<br/>Egress: all"]
    SGapp["aws_security_group.app<br/>Ingress: var.container_port/tcp ← alb-sg<br/>Egress: all"]

    Internet -->|HTTP :80| ALB
    ALB --> Listener
    Listener --> TG
    SGalb -. attached .-> ALB
    SGapp -. referenced in network_configuration .-> ECSsvc[(aws_ecs_service.app)]

    OutUrl(["Output: app_url<br/>http://&lt;alb dns_name&gt;"])
    ALB --> OutUrl
```

## Compute (ECS / Fargate)

Die Anwendung läuft als Fargate-Service in einem dedizierten ECS-Cluster. Tasks werden in die **öffentlichen** Subnetze platziert und bekommen eine öffentliche IP (`assign_public_ip = true`) — das ersetzt das fehlende NAT Gateway, damit ECR-Pulls und Container-Logs nach außen funktionieren. Die Verbindung zwischen Service und ALB erfolgt über die Target Group; der Service wartet bis zum Listener (`depends_on = aws_lb_listener.http`), bevor er Tasks registriert.

```mermaid
flowchart LR
    Cluster["aws_ecs_cluster.app<br/>name = var.app_name + '-cluster'"]

    TD["aws_ecs_task_definition.app<br/>family = var.app_name<br/>FARGATE, network_mode = awsvpc<br/>cpu = var.cpu, memory = var.memory"]

    Container["Container<br/>image = ecr_url + ':' + var.image_tag<br/>portMappings: var.container_port → var.container_port (tcp)<br/>logConfig: awslogs"]

    Svc["aws_ecs_service.app<br/>launch_type = FARGATE<br/>desired_count = var.desired_count<br/>health_check_grace_period = 60s<br/>network_configuration:<br/>&nbsp;&nbsp;subnets = aws_subnet.public[*]<br/>&nbsp;&nbsp;security_groups = [app-sg]<br/>&nbsp;&nbsp;assign_public_ip = true"]

    ExecRole["aws_iam_role.ecs_task_execution<br/>assume: ecs-tasks.amazonaws.com"]
    ExecAttach["aws_iam_role_policy_attachment.ecs_task_execution<br/>AmazonECSTaskExecutionRolePolicy"]

    Logs["aws_cloudwatch_log_group.app<br/>name = '/ecs/' + var.app_name<br/>retention_in_days = 14"]

    ECR[(aws_ecr_repository.app_ecr_repo)]
    TG[(aws_lb_target_group.app)]
    Listener[(aws_lb_listener.http)]

    Cluster --> Svc
    TD --> Svc
    TD --> Container
    Container -. pulls image .-> ECR
    Container -. ships stdout/stderr .-> Logs
    ExecRole --> TD
    ExecRole --> ExecAttach
    ExecRole -. used by .-> Container

    Svc -- load_balancer block --> TG
    Svc -. depends_on .-> Listener
```

> Architektur-Hinweis: Da keine NAT vorhanden ist und die Tasks öffentliche IPs erhalten, müssen sie zwingend in `aws_subnet.public` laufen — andernfalls würde der ECR-Pull beim Task-Start fehlschlagen.

## Abhängigkeitsgraph der Ressourcen

So referenzieren sich die Ressourcen gegenseitig (implizite Terraform-Abhängigkeiten).

```mermaid
flowchart LR
    AZsData["data.aws_availability_zones.available"]
    Caller["data.aws_caller_identity.current<br/>(bisher ungenutzt)"]

    VPC["aws_vpc.main"]
    IGW["aws_internet_gateway.main"]
    PubSubnets["aws_subnet.public[*]"]
    PrivSubnets["aws_subnet.private[*]"]
    PubRT["aws_route_table.public"]
    PrivRT["aws_route_table.private"]
    PubAssoc["aws_route_table_association.public[*]"]
    PrivAssoc["aws_route_table_association.private[*]"]

    ECR["aws_ecr_repository.app_ecr_repo"]
    ECRLP["aws_ecr_lifecycle_policy.app"]

    SGalb["aws_security_group.alb"]
    SGapp["aws_security_group.app"]
    ALB["aws_lb.app"]
    TG["aws_lb_target_group.app"]
    LST["aws_lb_listener.http"]

    Cluster["aws_ecs_cluster.app"]
    ExecRole["aws_iam_role.ecs_task_execution"]
    ExecAttach["aws_iam_role_policy_attachment.ecs_task_execution"]
    Logs["aws_cloudwatch_log_group.app"]
    TD["aws_ecs_task_definition.app"]
    Svc["aws_ecs_service.app"]

    AZsData --> PubSubnets
    AZsData --> PrivSubnets
    VPC --> IGW
    VPC --> PubSubnets
    VPC --> PrivSubnets
    VPC --> PubRT
    VPC --> PrivRT
    IGW --> PubRT
    PubRT --> PubAssoc
    PubSubnets --> PubAssoc
    PrivRT --> PrivAssoc
    PrivSubnets --> PrivAssoc

    ECR --> ECRLP

    VPC --> SGalb
    VPC --> SGapp
    SGalb --> SGapp
    VPC --> TG
    PubSubnets --> ALB
    SGalb --> ALB
    ALB --> LST
    TG --> LST

    ExecRole --> ExecAttach
    ExecRole --> TD
    Logs --> TD
    ECR --> TD

    Cluster --> Svc
    TD --> Svc
    PubSubnets --> Svc
    SGapp --> Svc
    TG --> Svc
    LST --> Svc
```

## Variablen

| Name | Typ | Default | Verwendet von |
|---|---|---|---|
| `aws_region` | string | `us-east-1` | Provider, `awslogs-region` der Task Definition |
| `app_name` | string | `quiz-app` | Tags, VPC-/Subnetz-/RT-/SG-Namen, ECR-Repo-Name, ECS-Cluster-/Service-/TaskDef-Namen, ALB-/TG-Namen, Log-Group-Name |
| `vpc_cidr` | string | `10.0.0.0/16` | VPC + Ableitung der Subnetz-CIDRs |
| `image_tag` | string | `latest` | Container-Image-Tag in der Task Definition |
| `container_port` | number | `3000` | App-SG-Ingress, `portMappings` der Task Definition, Target-Group-Port |
| `cpu` | number | `256` | Fargate-Task `cpu` |
| `memory` | number | `512` | Fargate-Task `memory` |
| `desired_count` | number | `1` | ECS-Service `desired_count` |

## Outputs

| Name | Quelle | Konsumiert von |
|---|---|---|
| `ecr_repository_name` | `aws_ecr_repository.app_ecr_repo.name` | `.github/workflows/ci-cd.yml` (Docker-Tag) |
| `ecr_repository_url` | `aws_ecr_repository.app_ecr_repo.repository_url` | — |
| `app_url` | `"http://${aws_lb.app.dns_name}"` | manuelle/operative Nutzung (öffentliche App-URL) |

## CI/CD-Pipeline

GitHub-Actions-Workflow unter `.github/workflows/ci-cd.yml`. Wird durch Push oder Pull Request auf `main` getriggert, der Job `build-and-deploy` läuft jedoch aktuell nur bei einem direkten Push auf `main` (`if: github.ref == 'refs/heads/main' && github.event_name == 'push'`).

```mermaid
flowchart TD
    Trigger{{"push / pull_request → main"}}
    Trigger --> Gate{"if: ref == main<br/>UND event == push"}
    Gate -- nein --> Skip([übersprungen])
    Gate -- ja --> Checkout

    subgraph Verify["Prüfen"]
        Checkout["actions/checkout@v4"]
        Node["actions/setup-node@v4<br/>node 24, npm-Cache"]
        Install["npm install"]
        Typecheck["npm run typecheck<br/>(tsc --noEmit)"]
        Tests["npm run test:coverage<br/>schlägt fehl bei lines &lt; 80% oder branches &lt; 70%"]
    end

    subgraph Provision["Infrastruktur bereitstellen"]
        AwsCreds["aws-actions/configure-aws-credentials@v4<br/>secrets.AWS_ACCESS_KEY_ID / _SECRET_ACCESS_KEY"]
        TfSetup["hashicorp/setup-terraform@v4"]
        TfInit["terraform init<br/>(S3-Backend bs-101010110)"]
        TfApply["terraform apply -auto-approve<br/>TF_VAR_image_tag = github.sha"]
        TfOut["terraform output -raw ecr_repository_name<br/>→ steps.tf-output.outputs.ecr_repository"]
    end

    subgraph Publish["Image veröffentlichen"]
        EcrLogin["aws-actions/amazon-ecr-login@v2<br/>→ steps.ecr-login.outputs.registry"]
        DockerBuild["docker build<br/>-t REGISTRY/REPO:SHA<br/>-t REGISTRY/REPO:latest"]
        DockerPush["docker push :SHA<br/>docker push :latest"]
    end

    Checkout --> Node --> Install --> Typecheck --> Tests
    Tests --> AwsCreds --> TfSetup --> TfInit --> TfApply --> TfOut
    TfOut --> EcrLogin --> DockerBuild --> DockerPush

    ECR[("AWS ECR<br/>aws_ecr_repository.app")]
    DockerPush --> ECR
    TfApply -. erstellt / aktualisiert .-> ECR
    TfOut -. liest Namen aus .-> ECR
```

> Hinweise:
> - `var.image_tag` fließt jetzt in `aws_ecs_task_definition.app` ein (`image = "...:${var.image_tag}"`); allerdings setzt der aktuelle Workflow `TF_VAR_image_tag` nicht mehr explizit, so dass beim Apply der Default `latest` greift.
> - Der Tag `latest` wird bei jedem Push überschrieben; der SHA-Tag ist der unveränderliche Bezug.
> - Die Lifecycle Policy auf der ECR-Repo entfernt alles über die 5 neuesten Images hinaus.
> - Der Workflow forciert kein neues ECS-Deployment nach dem Image-Push — der Service zieht erst dann eine neue Image-Version, wenn die Task Definition (z. B. via `image_tag`) geändert oder ein `force-new-deployment` ausgelöst wird.

## Dateien

| Datei | Inhalt |
|---|---|
| `main.tf` | terraform-Block, S3-Backend, AWS-Provider, `aws_caller_identity`-Data |
| `variables.tf` | Definitionen der Input-Variablen |
| `vpc.tf` | VPC, IGW, öffentliche/private Subnetze, Route Tables, Associations |
| `networking.tf` | ALB-/App-Security-Groups, Application Load Balancer, Target Group, HTTP-Listener |
| `ecr.tf` | ECR-Repository + Lifecycle Policy |
| `ecs.tf` | ECS-Cluster, Task-Execution-Role (+ Attachment), CloudWatch Log Group, Task Definition, Fargate-Service |
| `outputs.tf` | Terraform-Outputs |
