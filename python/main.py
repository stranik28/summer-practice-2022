from flask import Flask, request
from flask_cors import CORS
from flask_mysqldb import MySQL

app = Flask(__name__)
CORS(app)

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'u47473'
app.config['MYSQL_PASSWORD'] = 'n8848569'
app.config['MYSQL_DB'] = 'u47473'
mysql = MySQL(app)

@app.route("/")
def index():
    sender = request.args.get('sender')
    ammount = request.args.get('ammount')
    cursor = mysql.connection.cursor()
    cursor.execute(''' INSERT INTO solana_summer VALUES (%s,%s,%s) ''', (0,sender,ammount))
    mysql.connection.commit()
    cursor.close()
    return "Ok"

app.run()