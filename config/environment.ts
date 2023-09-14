export const environment = {
    name: 'development',
    // name: 'production',
    region: "eu-west-2",
    account: process.env.CDK_DEFAULT_ACCOUNT,
    github: {
        // working_branch: 'main',
        working_branch: 'development'
    }
}