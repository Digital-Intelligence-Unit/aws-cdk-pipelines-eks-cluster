import * as cdk from "@aws-cdk/core";
import eks = require("@aws-cdk/aws-eks");
import * as ssm from "@aws-cdk/aws-ssm";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
  ManualApprovalStep,
} from "@aws-cdk/pipelines";
import { EksClusterStage } from "./eks-cluster-stage";
import { AppDnsStage } from "./app-dns-stage";
import { _SETTINGS } from "../config";

export class EksPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const githubToken = cdk.SecretValue.secretsManager("github-oauth-token");

    const pipeline = new CodePipeline(this, "Pipeline", {
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub(
          "Digital-Intelligence-Unit/aws-cdk-pipelines-eks-cluster",
          "main",
          {
            authentication:githubToken
          }
        ),
        commands: ["npm ci", "npm run build", "npx cdk synth --verbose"],
      }),
      pipelineName: "BI_Platform_EKS-Pipeline",
    });

    const eksClusterStagePopHealth = new EksClusterStage(this, "EKSClusterB", {
      clusterVersion: eks.KubernetesVersion.V1_21,
      nameSuffix: "Population_Health_Dev",
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });

    const eksClusterWave = pipeline.addWave("DeployEKSClusters");

    const domainName = ssm.StringParameter.valueForStringParameter(
      this,
      "/eks-cdk-pipelines/zoneName"
    );

    eksClusterWave.addStage(eksClusterStagePopHealth, {
      post: [
        new ShellStep("Validate App", {
          commands: [
            `for i in {1..12}; do curl -Ssf http://echoserver.Population_Health_Dev.${domainName} && echo && break; echo -n "Try #$i. Waiting 10s...\n"; sleep 10; done`,
          ],
        }),
      ],
    });

    const appDnsStage = new AppDnsStage(this, "UpdateDNS", {
      envName: "Population_Health_Dev",
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });

    pipeline.addStage(appDnsStage, {
      pre: [new ManualApprovalStep(`Promote-Population_Health_Dev}-Environment`)],
    });
  }
}


