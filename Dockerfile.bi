FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends curl gcc g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY sprints/sprint-11/outputs/services/bi_service.py /app/bi_service.py

RUN pip install --no-cache-dir flask openpyxl

EXPOSE 8086
CMD ["python", "-u", "bi_service.py"]
