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

Eine einzelne ECR-Repository, benannt nach `var.app_name` (Default `quiz-app`), mit Image-Scanning beim Push, veränderbaren Tags und einer Lifecycle Policy, die nur die fünf neuesten Images behält.

```mermaid
flowchart LR
    Repo["aws_ecr_repository.app<br/>name = var.app_name<br/>scan_on_push = true<br/>image_tag_mutability = MUTABLE<br/>force_delete = true"]
    LP["aws_ecr_lifecycle_policy.app<br/>behält die 5 neuesten Images"]
    Repo --> LP

    OutName(["Output: ecr_repository_name"])
    OutUrl(["Output: ecr_repository_url"])
    Repo --> OutName
    Repo --> OutUrl
```

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

    ECR["aws_ecr_repository.app"]
    ECRLP["aws_ecr_lifecycle_policy.app"]

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
```

## Variablen

| Name | Typ | Default | Verwendet von |
|---|---|---|---|
| `aws_region` | string | `us-east-1` | Provider |
| `app_name` | string | `quiz-app` | Tags, VPC-/Subnetz-/RT-Namen, ECR-Repo-Name |
| `vpc_cidr` | string | `10.1.0.0/16` | VPC + Ableitung der Subnetz-CIDRs |
| `image_tag` | string | `latest` | _deklariert, aber aktuell ungenutzt_ |
| `container_port` | number | `3000` | _deklariert, aber aktuell ungenutzt_ |
| `cpu` | number | `256` | _deklariert, aber aktuell ungenutzt_ |
| `memory` | number | `512` | _deklariert, aber aktuell ungenutzt_ |
| `desired_count` | number | `1` | _deklariert, aber aktuell ungenutzt_ |

## Outputs

| Name | Quelle | Konsumiert von |
|---|---|---|
| `ecr_repository_name` | `aws_ecr_repository.app.name` | `.github/workflows/ci-cd.yml` (Docker-Tag) |
| `ecr_repository_url` | `aws_ecr_repository.app.repository_url` | — |

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
> - `TF_VAR_image_tag` wird an `terraform apply` übergeben, aber bisher referenziert keine Terraform-Ressource `var.image_tag` — also ohne Wirkung, bis eine ECS Task Definition hinzukommt.
> - Der Tag `latest` wird bei jedem Push überschrieben; der SHA-Tag ist der unveränderliche Bezug.
> - Die Lifecycle Policy auf der ECR-Repo entfernt alles über die 5 neuesten Images hinaus.

## Dateien

| Datei | Inhalt |
|---|---|
| `main.tf` | terraform-Block, S3-Backend, AWS-Provider, `aws_caller_identity`-Data |
| `variables.tf` | Definitionen der Input-Variablen |
| `vpc.tf` | VPC, IGW, öffentliche/private Subnetze, Route Tables, Associations |
| `ecr.tf` | ECR-Repository + Lifecycle Policy |
| `outputs.tf` | Terraform-Outputs |
