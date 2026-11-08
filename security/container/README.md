# KKS container lab

The local lab uses the hardened PrivateSession image and a separate PostgreSQL 18 image. Both services run as non-root with all Linux capabilities dropped, `no-new-privileges`, and read-only root filesystems. Neither service publishes a port. The services share an isolated network namespace so they can use the application's existing loopback-only database guard: Next.js binds to `127.0.0.1:3000`, and PostgreSQL binds to `127.0.0.1:5432`. No Windows database or host development secrets are mounted.

The named lab volume contains only synthetic data. The database bootstrap creates a restricted application role and separate development, shadow, and access-test databases inside the lab. The application role was verified to lack superuser, create-role, and create-database privileges. The tools image applies migrations and runs tests, then exits; build-only application dependencies are not copied into the standalone runtime. See [runtime-verification.txt](runtime-verification.txt) for the observed controls and results.

## Reproduce the lab

Run from the application repository root in PowerShell. If `.env.kks.local` already exists for this lab, retain it so stored ciphertext remains readable. On a fresh clone, generate independent synthetic credentials with Node.js 24:

```powershell
node -e "const fs=require('node:fs'),{randomBytes}=require('node:crypto');const values={KKS_POSTGRES_PASSWORD:randomBytes(32).toString('hex'),KKS_DB_PASSWORD:randomBytes(32).toString('hex'),KKS_DATA_ENCRYPTION_KEY:randomBytes(32).toString('base64'),KKS_AUTH_SECRET:randomBytes(32).toString('base64')};fs.writeFileSync('.env.kks.local',Object.entries(values).map(([k,v])=>k+'='+v).join('\n')+'\n',{flag:'wx'});"
```

Build, provision, and verify the isolated lab:

```powershell
$kks = @('compose','-p','privatesession-kks-lab','--env-file','.env.kks.local','-f','compose.kks.yaml')
docker @kks --profile tools build app db tools
docker @kks up -d --wait db
docker @kks run --rm --no-deps tools ./node_modules/.bin/prisma migrate deploy
docker @kks run --rm --no-deps tools sh -ec 'export DATABASE_URL=${DATABASE_URL%/privatesession_dev*}/privatesession_auth_rehearsal?schema=public; exec ./node_modules/.bin/prisma migrate deploy'
docker @kks run --rm --no-deps tools npm run db:seed
docker @kks up -d --wait app
docker @kks run --rm --no-deps tools npm run test:access
```

To show the runtime settings without printing environment variables:

```powershell
docker @kks ps
foreach ($service in 'app','db') {
  $id = docker @kks ps -q $service
  docker inspect --format '{{.Name}} user={{.Config.User}} cap-drop={{.HostConfig.CapDrop}} security={{.HostConfig.SecurityOpt}} read-only={{.HostConfig.ReadonlyRootfs}} bindings={{.HostConfig.PortBindings}}' $id
}
```

The expected bindings are `map[]` for both services. A container port listed without a host mapping is not a published port. For a manual demo screenshot, capture the two formatted inspect lines. Avoid printing the full Compose configuration or unfiltered container inspection because they include local lab credentials. `docker @kks stop app db` stops the lab without deleting its data.

## Risk references

| Tugas 1 risk                      | Control and evidence                                                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-01: vulnerable dependencies     | Pinned image inputs, Next.js security patch, before/after image scans and component inventories. See [scan evidence](../scans/README.md).                                                                |
| R-02: host and process compromise | [VM hardening](../hardening/README.md), non-root containers, no effective capabilities, no new privileges, and read-only root filesystems.                                                               |
| R-11: credential leakage          | Fresh synthetic secrets in the ignored `.env.kks.local`; credentials are excluded from the build context and demonstration output.                                                                       |
| R-13: storage disclosure          | Database traffic stays on isolated loopback; the application uses a restricted database role and encrypted synthetic records. The runtime checks do not establish protection against a compromised host. |
