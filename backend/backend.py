# app.py
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import psutil
import random
import docker

app = Flask(__name__)
CORS(app)

# Initialize Docker client
docker_client = docker.from_env()

def get_container_stats():
    """Get statistics from running Docker containers"""
    stats = []
    try:
        containers = docker_client.containers.list()
        for container in containers:
            stats.append({
                'id': container.id[:12],
                'name': container.name,
                'status': container.status,
                'image': container.image.tags[0] if container.image.tags else 'none'
            })
    except Exception as e:
        print(f"Error getting container stats: {e}")
    return stats

@app.route('/api/metrics')
def get_metrics():
    """Get system metrics for the last 24 hours"""
    now = datetime.now()
    metrics = []
    
    # Generate 24 hours of sample data
    for i in range(24):
        timestamp = (now - timedelta(hours=23-i)).strftime('%H:%M')
        metrics.append({
            'timestamp': timestamp,
            'cpu': psutil.cpu_percent(),
            'memory': psutil.virtual_memory().percent,
            'disk': psutil.disk_usage('/').percent
        })
    
    return jsonify(metrics)

@app.route('/api/services')
def get_services():
    """Get status of various services"""
    container_stats = get_container_stats()
    
    # Combine container info with additional service metadata
    services = []
    for container in container_stats:
        services.append({
            'id': container['id'],
            'name': container['name'],
            'status': 'healthy' if container['status'] == 'running' else 'unhealthy',
            'uptime': '24h 13m',  # You would calculate this based on container start time
            'description': f"Container running {container['image']}"
        })
    
    return jsonify(services)

@app.route('/api/alerts')
def get_alerts():
    """Get system alerts"""
    alerts = []
    
    # Check CPU usage
    cpu_percent = psutil.cpu_percent()
    if cpu_percent > 80:
        alerts.append({
            'id': 'cpu_high',
            'title': 'High CPU Usage',
            'description': f'CPU usage is at {cpu_percent}%',
            'severity': 'critical'
        })
    
    # Check memory usage
    memory = psutil.virtual_memory()
    if memory.percent > 85:
        alerts.append({
            'id': 'memory_high',
            'title': 'High Memory Usage',
            'description': f'Memory usage is at {memory.percent}%',
            'severity': 'critical'
        })
    
    # Check disk usage
    disk = psutil.disk_usage('/')
    if disk.percent > 90:
        alerts.append({
            'id': 'disk_high',
            'title': 'High Disk Usage',
            'description': f'Disk usage is at {disk.percent}%',
            'severity': 'warning'
        })
    
    return jsonify(alerts)

if __name__ == '__main__':
    app.run(debug=True)