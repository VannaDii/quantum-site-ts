# Quantum Site

In physics, a quantum (plural: quanta) is the minimum amount of any physical entity (physical property) involved in an interaction. In kind, a quantum site attempts to be the minimum amount of physical resources required for a functional presence on the web. This is achieved by focusing on using on-demand infrastructure: [serverless](https://serverless.com/).

## How it works

It works much like any other website. A user navigate to a URL, the URL is resolved via DNS, the request is sent to the indicated host, the host processes the request and provides a response, the response is delivered to the user.

## What's involved

For a typical website, a web server (or farm) would be up and running, ready to serve requests at all times. For a quantum site, thanks to serverless, there is no web server (nor farm) running all the time. This example uses several [Amazon Web Services (AWS)](https://aws.amazon.com/) to make this happen:

- [API Gateway](https://console.aws.amazon.com/apigateway/home)
  - Used to expose `dev` and `prod` stages of Lambda functions using Custom Domain Names, SSL, and Edge Optimizations.
- [Certificate Manager](https://console.aws.amazon.com/acm/home)
  - Used to issue and manage certificates which secure the public domains.
- [CloudFormation](https://console.aws.amazon.com/cloudformation/home)
  - Used to deploy _almost_ all of the required components of the quantum site, and to update it with code and asset changes.
- [CloudFront](https://console.aws.amazon.com/cloudfront/home)
  - Used to serve images and style sheet assets
- [IAM](https://console.aws.amazon.com/iam/home)
  - Used to manage deployment rights, and execution rights. This is mostly managed through CloudFormation.
- [Lambda](https://console.aws.amazon.com/lambda/home)
  - Used to serve the quantum site, process form POSTs, and generally be the website.
- [Route 53](https://console.aws.amazon.com/route53/home)
  - Used to resolve the public domain names to internal domain names and service like API Gateway and CloudFront. Specifically the `A record` aliasing feature offered by AWS.
- [S3](https://s3.console.aws.amazon.com/s3/home)
  - Used to store the static assets for the CDN.

There are also a few serverless components, and plug-ins at play here:

- [serverless-offline](https://github.com/dherault/serverless-offline#readme)
  - Used for running serverless locally to develop and test.
- [serverless-plugin-bind-deployment-id](https://github.com/jacob-meacham/serverless-plugin-bind-deployment-id#readme)
  - Used for sequencing deployment components after the API Gateway deployment step because it uses a time-stamped identifier.
- [serverless-s3-sync](https://github.com/k1LoW/serverless-s3-sync#readme)
  - Used for synchronizing the local build/assets folder with the CDN S3 Bucket, per stage.

## One-Time Manual Steps

There are a couple of manual steps involved, things that can't yet be automated because they require verification steps:

- Domain registration (if one isn't already registered)
  - Requires purchasing, etc.
- Hosted zone setup in Route 53
  - Requires domain ownership verification if the domain wasn't purchase via AWS and already setup in Route 53
- Public domain certificates
  - Requires domain ownership verification

These steps are covered below in limited detail, as seemed appropriate for the scope of this example.

The `contact` handler in this example also uses [AWS Simple Email Services (SES)](https://console.aws.amazon.com/ses/home) which requires additional setup, and is completely optional. It could be re-written to use SMTP, SendGrid, or other suitable email delivery provider.

## Full Setup Walk Through

1. Have, or register, a domain name
2. Have, or create, an [AWS account](https://aws.amazon.com/)
3. Configure `~/.aws/credentials` for the `aws-cli`
   1. Detailed instructions on setting up the `aws-cli` can be found in the [AWS CLI Documentation](https://docs.aws.amazon.com/lambda/latest/dg/setup-awscli.html).
4. Login to [AWS Console](https://console.aws.amazon.com)
5. Enable [Route 53](https://console.aws.amazon.com/route53/home) DNS. There may be manual domain ownership verification steps involved in this process, via email or DNS record creation. Be sure to read the steps along the way and ensure you can satisfy the verification requirements.
   1. Setup a Hosted Zone for the domain name
   2. To support the certificate request, create the root record in the zone:
      1. `.` - An `A record` pointed to any IP address
   3. Provide this name in the `serverless.yml` file as the value of the `baseName` variable.
      > `baseDNSName: 'mydomain.com'`
6. Access [Certificate Manager](https://console.aws.amazon.com/acm/home). There will be verification steps required during this step. If you hosted zone in Route 53 is already verified you may be able to use automated verification integration provided in the UI processes on the AWS console. Look for buttons that say "Use Route 53" and be aware that you might have to expand collapsed UI elements to find these buttons.
   4. Request a public certificate for:
      1. The root domain (mydomain.com)
      2. A SAN (subject alternate name) wildcard domain (\*.mydomain.com)
      3. Provide the ARN of the issued certificate in the `serverless.yml` file as the value of the `wildcardCertArn` variable.
         > `wildcardCertArn: 'arn:aws:acm:us-east-1:000000000000:certificate/00000000-0000-0000-0000-000000000000'`
7. Deploy the solution to the development stage using `yarn deploy` and then view the deployment by opening a browser and navigating to https://dev.mydomain.com
