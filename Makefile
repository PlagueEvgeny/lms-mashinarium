up:
	docker compose -f docker-compose-base.yaml up -d

down:
	docker compose -f docker-compose-base.yaml down && docker network prune --force
