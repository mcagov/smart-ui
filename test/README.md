# Creating TLS Certs for SMarTs' local nginx server

### Why must we do this?
We need to generate certs for the SMarT-UI dev/test server every three months via Lets Encrypt. Due to not having sudo permissions on MadeTech laptops, we have to use a containerised method instead. 

### How do I do this then?

To do this we need to run certbot using a docker container. Please follow these instructions -

1. Pull the route-53 certbot docker container using the following command-
```bash
docker pull certbot/dns-route53
```
2. Ensure you have an IAM user in the dev account, with the AmazonRoute53FullAccess policy attached, and have your AWS users Access_Key and Secret_Key ready.
3. Run the following command, ensuring to replace the AWS keys with your own - 

```bash
docker run -it \
  -v certs:/etc/letsencrypt \
  -v logs:/var/log/letsencrypt \
  -e AWS_ACCESS_KEY_ID=<your_access_key> \
  -e AWS_SECRET_ACCESS_KEY=<your_secret_key> \
  certbot/dns-route53 \
  certonly --preferred-challenges dns -d service.local.smart.mcga.uk -d aws.local.smart.mcga.uk -d id.local.smart.mcga.uk -d mcauk-smart-dev-attachments.aws.local.smart.mcga.uk -d mcauk-smart-dev-stagin-attachments.aws.local.smart.mcga.uk -d users.local.smart.mcga.uk
```

4. Once running, it will ask you to choose 1 of 3 choices. Press 1 to continue.
5. Upon completion, you can find the correct files from the docker container by using `docker volume inspect certs`.
6. Now log into the container using the following command `docker exec -it <container_id> sh`, ensuring you are running the container that was just created (will be new, and have the image file as cerbot/dns-route53).
7. Once in, navigate to where the files are, which is likely to be within `etc/letsencrypt/live/service.local.smart.mcga.uk`.
8. Check to make sure you have the `fullchain.pem` and `privkey.pem` files here, as well as `cert.pem` and `chain.pem`
9. Copy all of these files into a local folder using the docker copy command, which should look very similar to this - `docker cp <your_container_id>:/etc/letsencrypt/archive/service.local.smart.mcga.uk/privkey1.pem ./privkey.pem`
10. Once you have copied over the four files `cert.pem, chain.pem, fullchain.pem, privkey.pem`, you need to copy them into the parameter store within the AWS dev environment for SMarT. The names of the params closely match the names of the generated cert i.e. `privkey.pem` is for `/local/tls/key` etc. You can see the text output of the files just by using `cat privkey.pem` and copy/pasting that into the parameter store using the edit function in the console. Not all the files need to be moved - just the fullchain, cert, and key. It would be prudent to save the original certs elsewhere before editing the values, just in case there is an issue.
11. There are two ways you can move the new certs into SMarT-UI - you can either copy/paste the contents of the new files and replace the old string of text in there; or in the `terraform` folder in there is a script called `update-local-certs.sh` which, so long as you have the right AWS creds for the dev environment in your terminal, will copy them across for you.

I know this is quite convoluted, but without sudo permissions this is the best way to generate the certs needed.

Eddie Ashton

### Useful documentation

https://certbot-dns-route53.readthedocs.io/en/stable/
