# ECR Repository Deployment automatisieren und Docker Image builden und ins ECR Repo pushen

Requirement: AWS Credentials in GitHub austauschen, S3 Bucket für den Terraform state anlegen und an der richtigen Stelle in der `main.tf` austauschen

1. Falls ihr noch keine vollständige Version von der ecr.tf habt, kopiert euch [../terraform/ecr.tf](../terraform/ecr.tf). Vergleicht die Komponenten mit der AWS Console UI und guckt, dass ihr die jeweiligen Komponenten aus der TF-Datei dort wiederfindet
2. [../terraform/outputs.tf](../terraform/outputs.tf) Kopieren und bei euch einfügen. Nachdem ihr das Terraform Skript angewendet habt, dann überprüft in dem S3 bucket, dass eure State Datei auch diese Output Variablen aufweist
3. Ergänzt eure ci-cd Datei mit folgendem. Versucht dabei die einzelnen Schritte nachzuvolziehen und schreibt euch ggf. Fragen auf.

```bash

      - name: Read ECR repository name from Terraform output
        id: tf-output
        working-directory: terraform
        run: echo "ecr_repository=$(terraform output -raw ecr_repository_name)" >> "$GITHUB_OUTPUT"

      - name: Login to Amazon ECR
        id: ecr-login
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.ecr-login.outputs.registry }}
          ECR_REPOSITORY: ${{ steps.tf-output.outputs.ecr_repository }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

```
