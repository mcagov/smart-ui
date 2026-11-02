# Creating TLS Certs for SMarTs' local nginx server

### Why must we do this?
We need to generate certs for the SMarT-UI dev/test server every three months via Lets Encrypt. Due to not having sudo permissions on MadeTech laptops, we have to use a containerised method instead. 

### How do I do this then?

To do this we need to run certbot in a container using Podman (see the main README for Podman setup). Please follow these instructions -

1. Pull the route-53 certbot container image using the following command-
```bash
podman pull certbot/dns-route53
```
2. Ensure you have an IAM user in the dev account, with the AmazonRoute53FullAccess policy attached, and have your AWS users Access_Key and Secret_Key ready.
3. Run the following command, ensuring to replace the AWS keys with your own - 

```bash
podman run -it \
  -v certs:/etc/letsencrypt \
  -v logs:/var/log/letsencrypt \
  -e AWS_ACCESS_KEY_ID=<your_access_key> \
  -e AWS_SECRET_ACCESS_KEY=<your_secret_key> \
  certbot/dns-route53 \
  certonly --preferred-challenges dns -d service.local.smart.mcga.uk -d aws.local.smart.mcga.uk -d id.local.smart.mcga.uk -d mcauk-smart-dev-attachments.aws.local.smart.mcga.uk -d mcauk-smart-dev-stagin-attachments.aws.local.smart.mcga.uk -d users.local.smart.mcga.uk
```

4. Once running, it will ask you to choose 1 of 3 choices. Press 1 to continue.
5. Once certbot finishes, the container stops, so you can't `exec` into it. The certs are kept in the `certs` volume, though. Copy them out to a local folder by mounting that volume into a throwaway container:

```bash
mkdir -p ./new-certs
podman run --rm \
  -v certs:/etc/letsencrypt:ro \
  -v "$PWD/new-certs":/out \
  public.ecr.aws/docker/library/alpine:latest \
  sh -c 'cp -L /etc/letsencrypt/live/service.local.smart.mcga.uk/*.pem /out/'
```

The files in `live/` are links to the newest numbered copies in `archive/`. `cp -L` copies the real files, so you get the current certs under their plain names.

6. Check that `./new-certs` contains `cert.pem`, `chain.pem`, `fullchain.pem` and `privkey.pem`. The folder holds the private key, so delete it once you've finished the next step and don't commit it.
7. Once you have copied over the four files `cert.pem, chain.pem, fullchain.pem, privkey.pem`, you need to copy them into the parameter store within the AWS dev environment for SMarT. The names of the params closely match the names of the generated cert i.e. `privkey.pem` is for `/local/tls/key` etc. You can see the text output of the files just by using `cat privkey.pem` and copy/pasting that into the parameter store using the edit function in the console. Not all the files need to be moved - just the fullchain, cert, and key. It would be prudent to save the original certs elsewhere before editing the values, just in case there is an issue.

I know this is quite convoluted, but without sudo permissions this is the best way to generate the certs needed.

Eddie Ashton

### Useful documentation

https://certbot-dns-route53.readthedocs.io/en/stable/
