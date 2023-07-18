# This is the config file for Gunicorn which sets up the worker mode, port, time-out and format of log files
# Created by Shushi Luo

import gevent.monkey
gevent.monkey.patch_all()

workers = 3  

bind = '127.0.0.1:8000'

timeout = 1800  

worker_class = 'gevent'

worker_connections = 1000 

loglevel = 'warning'

#logconfig_dict define the format of the error log file and access log file and limit their file size.
logconfig_dict = {
    "version": 1,
    "disable_existing_loggers": False,

    "root": {"level": "INFO", "handlers": ["error_file", "access_file"]},
    "loggers": {
        "gunicorn.error": {
            "level": "INFO",  
            "handlers": ["error_file"],  
            "propagate": 1,
            "qualname": "gunicorn.error"
        },

        "gunicorn.access": {
            "level": "INFO",
            "handlers": ["access_file"],
            "propagate": 0,
            "qualname": "gunicorn.access"
        }
    },
    "handlers": {
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "maxBytes": 1024 * 1024 * 50,  
            "backupCount": 1,  
            "formatter": "generic",  
            # "mode": "w+",
            "filename": "/home/deployer/ppi/logs/gunicorn_error.log"  
        },
        "access_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "maxBytes": 1024 * 1024 * 50,
            "backupCount": 1,
            "formatter": "generic",
            "filename": "/home/deployer/ppi/logs/gunicorn_access.log",
        }
    },
    "formatters": {
        "generic": {
            "format": "'[%(process)d] [%(asctime)s] %(levelname)s [%(filename)s:%(lineno)s] %(message)s'",  
            "datefmt": "[%Y-%m-%d %H:%M:%S %z]",  
            "class": "logging.Formatter"
        },
        "access": {
            "format": "'[%(process)d] [%(asctime)s] %(levelname)s [%(filename)s:%(lineno)s] %(message)s'",
            "class": "logging.Formatter"
        }
    }
}
