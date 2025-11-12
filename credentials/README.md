# Credentials Folder

## The purpose of this folder is to store all credentials needed to log into your server and databases. This is important for many reasons. But the two most important reasons is

    1. Grading , servers and databases will be logged into to check code and functionality of application. Not changes will be unless directed and coordinated with the team.
    2. Help. If a class TA or class CTO needs to help a team with an issue, this folder will help facilitate this giving the TA or CTO all needed info AND instructions for logging into your team's server.

# Below is a list of items required. Missing items will causes points to be deducted from multiple milestone submissions.

1. Server URL or IP

- ec2-3-138-190-108.us-east-2.compute.amazonaws.com
- http://3.17.153.17:3000
2. SSH username

- ubuntu

3. SSH password or key.
   <br> If a ssh key is used please upload the key to the credentials folder.

- in folder

4. Database URL or IP and port used.
   <br><strong> NOTE THIS DOES NOT MEAN YOUR DATABASE NEEDS A PUBLIC FACING PORT.</strong> But knowing the IP and port number will help with SSH tunneling into the database. The default port is more than sufficient for this class.

- csc648-team14-db.cbqekuam66ja.us-east-2.rds.amazonaws.com
- Port range: 3306

5. Database username

- csc648team14db (Master Username)

6. Database password

- team14pass

7. Database name (basically the name that contains all your tables)

- db14

8. Instructions on how to use the above information.

9. (optional section created by William for convenience)

- ssh -i "C:\Users\willi\Desktop\gatorTutorsKP.pem" ubuntu@ec2-3-17-153-17.us-east-2.compute.amazonaws.com
- mysql -h csc648-team14-db.cbqekuam66ja.us-east-2.rds.amazonaws.com -P 3306 -u csc648team14db -p
- http://3.17.153.17:3000

pm2 Redeploy commands:
   On Local Machine (requires .pem key in that dir):
    - pm2 deploy production setup (First time)
    - pm2 deploy production (Every other time)
   On EC2 Instance:
   - (Be in application dir:)
   - npm install
   - pm2 start ecosystem.config.js --env production
   - pm2 save
   


# Most important things to Remember

## These values need to kept update to date throughout the semester. <br>

## <strong>Failure to do so will result it points be deducted from milestone submissions.</strong><br>

## You may store the most of the above in this README.md file. DO NOT Store the SSH key or any keys in this README.md file.








