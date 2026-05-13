# ECS Deployment

Requirement: AWS Credentials in GitHub austauschen, S3 Bucket für den Terraform state anlegen und an der richtigen Stelle in der `main.tf` austauschen

1. `git pull` --> Neuen Branch anlegen (`git checkout -b feature/ecs`)
2. ![../terraform/ecr.tf](../terraform/ecr.tf) und ![../terraform/networking.tf](../terraform/networking.tf) Kopieren und bei euch in das Repo einfügen unter dem Ordner terraform. Denkt dran an der Pipeline müsst ihr nichts ändern, weil unsere KOnfiguration von vorher alle terraform Dateien mit abgreift
3. Merge auf main --> Piepline in Github Actions überprüfen
4. AWS Console prüfen und die verbundenen Log Groups in dem Cloudwatch Service überprüfen
5. ![../terraform/ecr.tf](../terraform/ecr.tf) und ![../terraform/networking.tf](../terraform/networking.tf) prüfen und gucken wo ihr die Definitionen in der AWS Cloud wiederfindet
