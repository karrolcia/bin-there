# Running binthere.online on the hippo box

binthere is one Docker container next to Hippocampus on the hippo box
(`89.167.92.238`, ssh alias `hippo`). It follows the same pattern:
a checkout in `/opt/<project>`, `docker compose up -d --build`, and Caddy (a host
systemd service) in front.

```
browser ──HTTPS──▶ Caddy (host, /etc/caddy/Caddyfile)
                     └─ binthere.online ──▶ 127.0.0.1:3100 ──▶ container "binthere"
                                                                ├─ the built website
                                                                ├─ /api/* (Hono)
                                                                └─ /data/binthere.db (bin counts only)
```

**Walled off from Hippocampus:**
- Separate Compose project, so a separate network and volume.
- Non-root user (uid 1002), read-only filesystem, all capabilities dropped.
- Memory, CPU and process caps.
- No access to `/opt/hippocampus`, its volume or its `.env`.

**What it stores:** OpenStreetMap bin id, position, name and a use count.
- No accounts, IPs, user locations or access logs.
- Rate limiting is in memory only.

## API

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | `{"status":"ok","db":"ok"}` |
| GET | `/api/popular-bins?lat=&lng=&radiusKm=5&limit=50` | Most-used bins near a point (backup list when Overpass is down) |
| POST | `/api/binned` `{"osmId","lat","lng","name"}` | +1 for that bin. Counted once per visitor per bin per 6h. |

**Limits:**
- 10 writes and 60 reads per minute per client.
- 1 KB body.
- JSON only, unknown fields refused.

## Deploy (after the first setup)

```sh
ssh hippo 'cd /opt/bin-there && git pull && git log --oneline -1 && docker compose up -d --build'
curl -s https://binthere.online/api/health
```

Tests run inside the image build, so a failing test stops the deploy and the
old container keeps running.

## First setup and cutover from Lovable

Lovable keeps serving the site until step 5, so there is no downtime.

1. **Check port 3100 is free** on the box: `ssh hippo 'ss -tlnp | grep -c :3100'` should print `0`.
   If not, change `127.0.0.1:3100` in `docker-compose.yml` and in `deploy/Caddyfile.binthere`.
2. **Checkout and token:**
   ```sh
   ssh hippo
   sudo git clone https://github.com/karrolcia/bin-there /opt/bin-there
   cd /opt/bin-there
   sudo sh -c 'umask 077; printf "VITE_MAPBOX_TOKEN=pk...\n" > .env'   # the restricted public token
   sudo docker compose up -d --build
   curl -s http://127.0.0.1:3100/api/health
   ```
   Until the PR is merged, add `git checkout self-host-hetzner` after `cd`.
3. **Look at it before going live** through an SSH tunnel from your Mac:
   `ssh -L 3100:127.0.0.1:3100 hippo`, then open http://localhost:3100.
   The map only loads if `http://localhost:3100` is temporarily allowed on the Mapbox token.
4. **Caddy:** append `deploy/Caddyfile.binthere` to `/etc/caddy/Caddyfile`, then run
   `sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy`.
   Caddy can't get a certificate for binthere.online until DNS points here. It keeps
   retrying, and the reload doesn't affect hippo.sarna.rocks.
5. **DNS**, at the registrar (nameservers are `ns-cloud-c*.googledomains.com`, now Squarespace Domains):
   - `binthere.online` A record: `185.158.133.1` (Lovable) → `89.167.92.238`
   - `www.binthere.online`: CNAME → `binthere.online` (it has no record today)

   Once DNS has switched over, check `curl -sI https://binthere.online` and
   `curl -s https://binthere.online/api/health`. Caddy issues the certificate on first use.
6. **Backups** (bin counts only, local, last 14):
   ```sh
   sudo cp deploy/binthere-backup.service deploy/binthere-backup.timer /etc/systemd/system/
   sudo systemctl daemon-reload && sudo systemctl enable --now binthere-backup.timer
   sudo systemctl start binthere-backup.service && ls -l /var/backups/binthere
   ```
7. **Mapbox:** restrict the token to `https://binthere.online` and `https://www.binthere.online`,
   and remove `localhost`.
8. **PostHog:** Project settings → turn on "Discard client IP data".
9. **Merge the PR** and run `git checkout main && git pull` on the box.
10. **Lovable:**
    - Remove the custom domain.
    - Export anything you want to keep (Cloud tab).
    - Turn off or delete Lovable Cloud. That deletes the old Supabase database, which holds the
      old accounts and the activity log with IPs and locations.

## Follow-ups (not done here)

- An uptime check for `https://binthere.online/api/health` in ops-kit / UptimeRobot.
- An offsite copy of `/var/backups/binthere`, for example to the Storage Box Hippocampus uses.
  Low priority: it's only bin counts.
