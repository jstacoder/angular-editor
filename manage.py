from flask_script import Manager, commands
from sql_app import app


manager = Manager(app)

manager.run()
