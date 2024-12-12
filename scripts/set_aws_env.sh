export AWS_PROFILE="smart-dev-admin"
export AWS_DEFAULT_REGION="eu-west-2"
#export AWS_ACCESS_KEY_ID="$(cat ~/.aws/credentials | grep $AWS_PROFILE -A 2 | grep aws_access_key_id | awk '{print $3}')"
#export AWS_SECRET_ACCESS_KEY="$(cat ~/.aws/credentials | grep $AWS_PROFILE -A 2 | grep aws_secret_access_key | awk '{print $3}')"

export AWS_ACCESS_KEY_ID=$(aws --profile default configure get aws_access_key_id)
export AWS_SECRET_ACCESS_KEY=$(aws --profile default configure get aws_secret_access_key)

#https://blog.gruntwork.io/authenticating-to-aws-with-environment-variables-e793d6f6d02e





aws sts assume-role --role-arn arn:aws:iam::777788889999:role/MyRole --role-session-name ben


aws sts assume-role --role-arn $(aws --profile smart-dev-admin configure get role_arn) --role-session-name craig | jq '.Credentials.AccessKeyId,.Credentials.SecretAccessKey,.Credentials.SessionToken'

{
    "Credentials": {
        "AccessKeyId": "xxx",
        "SecretAccessKey": "xxx",
        "SessionToken": "xxx",
        "Expiration": "2022-08-18T16:19:32+00:00"
    },
    "AssumedRoleUser": {
        "AssumedRoleId": "AROAQEOGYEGLYJGNOWJ2H:craig",
        "Arn": "arn:aws:sts::009543623063:assumed-role/CrossAccount-Administrator/craig"
    }
}
