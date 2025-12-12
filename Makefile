up:
	docker compose -f docker-compose-base.yaml up -d

down:
	docker compose -f docker-compose-base.yaml down && docker network prune --force

run:
	docker compose -f docker-compose-base.yaml up -d db alembic_migrations frontend

rebuild:
	docker compose -f docker-compose-base.yaml up backend --build -d
