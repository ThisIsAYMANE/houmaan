#!/bin/sh
# Seed database inside Docker container

docker exec bc-game-postgres psql -U bcgame -d bcgame << 'EOF'
-- Game Categories
INSERT INTO game_categories (id, name, slug, "order") VALUES
('cat1', 'BC Originaux', 'bc-originaux', 1),
('cat2', 'BC Exclusif', 'bc-exclusif', 2),
('cat3', 'Jeux populaires', 'jeux-populaires', 3),
('cat4', 'Machines à sous', 'machines-a-sous', 4),
('cat5', 'Casino en direct', 'casino-en-direct', 5),
('cat6', 'Jeux télévisés', 'jeux-televises', 6),
('cat7', 'Jeux de table', 'jeux-de-table', 7),
('cat8', 'Blackjack', 'blackjack', 8),
('cat9', 'Roulette', 'roulette', 9),
('cat10', 'Baccarat', 'baccarat', 10),
('cat11', 'Poker', 'poker', 11),
('cat12', 'Bingo', 'bingo', 12)
ON CONFLICT (slug) DO NOTHING;

-- Game Providers
INSERT INTO game_providers (id, name, slug) VALUES
('prov1', 'BC.GAME Originals', 'bc-game-originals'),
('prov2', 'Evolution', 'evolution'),
('prov3', 'Pragmatic Play', 'pragmatic-play'),
('prov4', 'HACKSAW', 'hacksaw'),
('prov5', 'PG Soft', 'pg-soft'),
('prov6', 'TaDa', 'tada')
ON CONFLICT (slug) DO NOTHING;

-- Sports
INSERT INTO sports (id, name, slug, "order") VALUES
('sport1', 'Football', 'football', 1),
('sport2', 'eFootball', 'efootball', 2),
('sport3', 'Basketball', 'basketball', 3),
('sport4', 'Tennis', 'tennis', 4),
('sport5', 'Cricket', 'cricket', 5),
('sport6', 'Hockey sur glace', 'hockey-sur-glace', 6),
('sport7', 'Baseball', 'baseball', 7),
('sport8', 'Handball', 'handball', 8)
ON CONFLICT (slug) DO NOTHING;

-- VIP Levels
INSERT INTO vip_levels (id, level, name, min_wager) VALUES
('vip0', 0, 'VIP0', 0),
('vip1', 1, 'VIP1', 1000),
('vip2', 2, 'VIP2', 5000),
('vip3', 3, 'VIP3', 10000),
('vip4', 4, 'VIP4', 50000),
('vip5', 5, 'VIP5', 100000)
ON CONFLICT (level) DO NOTHING;

SELECT 'Seed completed successfully!' as status;
EOF

















