# RCIOTS client NodeJS
## Remote Control service to manage IOT devices from K8s or Openshift.

### Introduction

***TLTR:*** This is a NodeJS app to run on Openshift, who will enable us to manage remote devices connected by websockets and send them configuration based on edgeTemplates CR, to collect the output of docker-compose runners and metrics from the client, to update the corresponding CR edgeDevice inside Openshift API.

Together with the repo [rciots-client-nodejs](https://github.com/mparram/rciots-client-nodejs), they complete the proposal to the RedHat QIOT Hackfest 2021 from the "Sopra Steria" team.

It's a POC to manage the docker-composes with Quarkus pods, running in RaspberryPi 3b+ with FedoraIOT arm64 from Openshift Console. valid for any device running Docker / podman and able to run nodejs. But extensible through plugins to meet new needs.

The device-controller is an endpoint who waits for connections through Web Socket Secure, these connections are authenticated by a token sent by the client, and it is the only thing to define in the clients, containing the url endpoint and the token. (also needs the ca.cer to trust the ingress CA, preconfigured to the provider of current QIOT cluster *.apps.cluster-cf04.cf04.sandbox37.opentlc.com)
The tokens corresponds to custom resources objects of type edgeTemplate, which are templates with the configuration that we want to load on clients. This configuration, apart from metadata, can be from different plugins, at the moment I have created two, one for metrics, and another for docker-compose also valid for podman.

When the client obtains the definition of docker-compose, its plugin will run the compose and responds through the same socket to the device-controller, to update the status corresponding to this device through the k8s api.
With this we can not only automate the deployment, but also monitor the health of the quarkus pods that we have running on the devices from the Openshift console. We always see in the presentations that the Openshift control ends in the Edge Workers layer, with this solution we can also operate the Edge Devices and sensor layer.
I commented that the other plugin is the metric one, the function of this plugin is to collect metrics every number of seconds from other plugins (so far I have created: dummy random metric, temperature + humidity from DHT, GPS from USB Antenna + gpsd) and send the updates by wss to include the latest state in edgeDevice type CRs.
As ideas for the future, it would be able to make a plugin that simulates launching liveness and readiness probes from the client to the pods that it is executing, and report the states to the device-controller to update it in its edgeDevice.status within the k8s api.

### Requirements 

First of all if you want to deploy rciots-device-controller in Openshift / K8s, **you need cluster-admin to create Custom Resource Definitions *"/k8s/10-crd.yaml"***

We need to create a namespace, for example *rciots*, and then **be sure to create yaml files in that ns**.
```
oc new-project rciots
```

### Create Openshift Objects:

# *"/k8s/10-crd.yaml":*

In this yaml are defined the required Custom Respource Definitions "edgeTemplate" and "edgeDevice"

```
oc apply -f /k8s/10-crd.yaml
```

# *"/k8s/20-role.yaml":*

Role to access just to our custom resources in the namespace

```
oc apply -f /k8s/20-role.yaml
```

# *"/k8s/25-rolebinding-user.yaml":*

**OPTIONAL** If you want to grant access to custom resources to a user, edit the username and apply it, if the users are cluster:admin doesn't require this yaml

```
oc apply -f /k8s/25-rolebinding-user.yaml
```

# *"/k8s/30-serviceaccount.yaml":*

Service account required to query Openshift API from the device-controller

```
oc apply -f /k8s/30-serviceaccount.yaml
```

# *"/k8s/40-rolebinding.yaml":*

Grant permissions to the service account over the Custom Resources.

# *"/k8s/50-edgetemplate.yaml":*

Example template to run docker-compose and collect a dummy metric

