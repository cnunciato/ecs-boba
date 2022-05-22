import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

import { rootPulumiStackTypeName } from "@pulumi/pulumi/runtime";

const cluster = new aws.ecs.Cluster("default-cluster");

const lb = new awsx.lb.ApplicationLoadBalancer("nginx-lb", {
    listener: {
        port: 3001,
    },
});

const dblb = new awsx.lb.ApplicationLoadBalancer("db-lb", {
    listener: {
        port: 27017,
    },
});

const frontend = new awsx.ecs.FargateService("frontend-service", {
    cluster: cluster.arn,
    desiredCount: 1,
    taskDefinitionArgs: {
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
        },
    },
});

const backend = new awsx.ecs.FargateService("backend-service", {
    cluster: cluster.arn,
    desiredCount: 1,
    taskDefinitionArgs: {
        containers: {
            backend: {
                image: "pulumi/tutorial-pulumi-fundamentals-backend:latest",
                cpu: 512,
                memory: 1024,
                essential: true,
                environment: [
                    {
                        "name": "DATABASE_HOST",
                        "value": pulumi.concat("mongodb://", dblb.loadBalancer.dnsName, ":27017"),
                    },
                    {
                        "name": "DATABASE_NAME",
                        "value": "cart",
                    },
                    {
                        "name": "NODE_ENV",
                        "value": "development",
                    },
                ],
                portMappings: [
                    {
                        containerPort: 3000,
                        hostPort: 3000,
                    },
                ],
            },
        },
    },
});

const db = new awsx.ecs.FargateService("db-service", {
    cluster: cluster.arn,
    desiredCount: 1,
    taskDefinitionArgs: {
        runtimePlatform: {
            cpuArchitecture: "ARM64",
        },
        containers: {
            mongo: {
                image: "pulumi/tutorial-pulumi-fundamentals-database-local:latest",
                cpu: 512,
                memory: 1024,
                essential: true,
                portMappings: [
                    {
                        containerPort: 27017,
                        targetGroup: dblb.defaultTargetGroup,
                    },
                ],
            },
        },
    },
});


export const url = lb.loadBalancer.dnsName;
export const db_url= pulumi.concat("mongodb://", dblb.loadBalancer.dnsName, ":27017");


