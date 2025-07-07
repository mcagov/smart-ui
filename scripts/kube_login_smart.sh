#!/bin/bash

echo "Please enter the AWS account you are using: "
echo "1. Dev"
echo "2. Pre-Prod"
echo "3. Prod"
read choice

while [[ "$choice" != "1" && "$choice" != "2" && "$choice" != "3" ]]; do
    echo "Invalid choice. Please enter 1, 2, or 3."
    read -p "Enter your choice: " choice
done

if [[ $choice == "1" ]]; then
    account="009543623063"
elif [[ $choice == "2" ]]; then
    account="531614758775"
elif [[ $choice == "3" ]]; then
    account="373269576498"
fi

login=$(aws sts assume-role --role-arn "arn:aws:iam::$account:role/CrossAccount-Administrator" --role-session-name EKS_Access)

AWS_ACCESS_KEY_ID=$(echo "$login" | jq '.Credentials.AccessKeyId')
AWS_SECRET_ACCESS_KEY=$(echo "$login" | jq '.Credentials.SecretAccessKey')
AWS_SESSION_TOKEN=$(echo "$login" | jq '.Credentials.SessionToken')

echo -e "\nPlease copy the following and input them into the terminal - \n"
echo -e "-----------------------------------------\n"
echo export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID"
echo export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY"
echo export AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN"


if [[ $choice == "1" ]]; then
    AWS_ENV="dev"
elif [[ $choice == "2" ]]; then
    AWS_ENV="pre-prod"
elif [[ $choice == "3" ]]; then
    AWS_ENV="live"
fi

echo -e "\n-----------------------------------------\n"
echo -e "Use the following command to log into the kube cluster - \n"
echo "aws eks update-kubeconfig --region eu-west-2 --name mcauk-smart-"$AWS_ENV"-eks"