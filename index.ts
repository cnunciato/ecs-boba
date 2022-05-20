import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const cluster = new aws.ecs.Cluster("default-cluster");

const lb = new awsx.lb.ApplicationLoadBalancer("nginx-lb", {
    listener: {
        port: 3001,
    },
});

const service = new awsx.ecs.FargateService("my-service", {
    cluster: cluster.arn,
    desiredCount: 1,
    taskDefinitionArgs: {
        runtimePlatform: {
            cpuArchitecture: "ARM64",
        },
        containers: {
            frontend: {
                image: "pulumi/tutorial-pulumi-fundamentals-frontend:latest",
                cpu: 512,
                memory: 1024,
                essential: true,
                portMappings: [
                    {
                        containerPort: 3001,
                        targetGroup: lb.defaultTargetGroup,
                    },
                ],
            },
            backend: {
                image: "pulumi/tutorial-pulumi-fundamentals-backend:latest",
                cpu: 512,
                memory: 1024,
                essential: true,
                portMappings: [
                    {
                        containerPort: 3000,
                        hostPort: 3000,
                    },
                ],
            },
            mongo: {
                image: "pulumi/tutorial-pulumi-fundamentals-database-local:latest",
                cpu: 512,
                memory: 1024,
                essential: true,
                portMappings: [
                    {
                        containerPort: 27017,
                        hostPort: 27017,
                    },
                ],
            },
        },
    },
});

export const url = lb.loadBalancer.dnsName;
