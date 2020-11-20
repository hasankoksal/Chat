cd ..
source venv/bin/activate
cd mysite
daphne -e ssl:3030:privateKey=key.pem:certKey=crt.pem mysite.asgi:application