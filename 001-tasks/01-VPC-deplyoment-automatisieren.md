# Aufgabe 1: VPC Deplyoment automatsieren

0. Kramt alte Notizen/Repos raus und guckt wie ihr dort Terraform automatisiert deployt habt
1. Legt einen Workflow mit Github Actions an, der Terraform apply ausführt auf einen Commit/Merge auf den `main`-Branch
   Tipp:
   1. Denkt an den Austausch von eurem remote S3-Bucket
   2. Denkt an euere Secrets in dem Github repository
2. Fügt einen Workflow hinzu, über den man terraform destroy manuell triggern kann

Hinweis: Ihr könnt gerne eure Terraform Dateien aus der HA nehmen, ansonsten findet ihr den aktuellen Stand [../terraform/](../terraform/)
