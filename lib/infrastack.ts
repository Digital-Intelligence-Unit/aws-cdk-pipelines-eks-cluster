import { Stack } from "aws-cdk-lib";
import { Peer, Port, SecurityGroup, SubnetType, Vpc, IVpc } from "aws-cdk-lib/aws-ec2";
import { CfnResolverEndpoint, CfnResolverRule, CfnResolverRuleAssociation } from "aws-cdk-lib/aws-route53resolver";
import { _SETTINGS } from "../config";

export class InfrastructureStack extends Stack {

  public vpc: IVpc;
  public secGroups: SecurityGroup[];

  constructor(scope: any, id: string, props?: any) {
    
    super(scope, id, props);

    // Create or retrieve vpc
    this.vpc = this.getOrCreateVpc();

    // Create security groups
    this.secGroups = this.createSecurityGroups();

    // Add HSCN DNS resolution
    this.createHSCNRoute53Resolver();
  }

  getOrCreateVpc() {
    if (_SETTINGS.existingVPC) {
      // Lookup existing from account
      return Vpc.fromLookup(this, "BIPlatformVPC", { vpcId: _SETTINGS.existingVPCID });
    } else {
      // Create new...
      return new Vpc(this, "BIPlatformVPC", {
        cidr: _SETTINGS.containerIPs[0],
        subnetConfiguration: [
          { name: "BIPlatformVPC-private-0", subnetType: SubnetType.PRIVATE_ISOLATED },
          { name: "BIPlatformVPC-private-1", subnetType: SubnetType.PRIVATE_ISOLATED },
          { name: "BIPlatformVPC-public-0", subnetType: SubnetType.PUBLIC },
          { name: "BIPlatformVPC-public-1", subnetType: SubnetType.PUBLIC },
        ],
        maxAzs: 2,
      });
    }
  }

  createSecurityGroups() {
    // Create new security group
    const securityGroup = new SecurityGroup(this, "VPCSecGroup", {
      securityGroupName: "SG-BIPlatformVPC",
      description: "Security Group for the BI Platform VPC",
      vpc: this.vpc,
    });

    // Allows access between containers
    _SETTINGS.containerIPs.forEach((range: string) => {
      securityGroup.addIngressRule(Peer.ipv4(range), Port.tcp(5432), "Access between containers and Database");
    });

    return [securityGroup];
  }

  createHSCNRoute53Resolver() {
    // Create resolver
    const cfnResolverEndpoint = new CfnResolverEndpoint(this, 'HSCNResolverEndpoint', {
      name: 'HSCN DNS Resolver',
      direction: 'OUTBOUND',
      ipAddresses: _SETTINGS.Route53ResolverConfig.ips,
      securityGroupIds: this.secGroups.map((group) => group.securityGroupId),
    });

    // Add rules
    const domains: any = { 'MLCSUReidApi': 'rpcwebapi.midlandsandlancashirecsu.nhs.uk' }
    for (const name in domains) {
      // Create rule for domain
      const domainRule = new CfnResolverRule(this, name + 'Rule', {
        name: name,
        domainName: domains[name],
        ruleType: 'FORWARD',
        resolverEndpointId: cfnResolverEndpoint.attrResolverEndpointId,
        targetIps: [
          { ip: '155.231.231.1', port: '53' },
          { ip: '155.231.231.2', port: '53' }
        ],
      });

      // Associate to vpc
      new CfnResolverRuleAssociation(this, name + 'RuleAssociation', {
        resolverRuleId: domainRule.attrResolverRuleId,
        vpcId: this.vpc.vpcId,
      });
    }
  }
}
