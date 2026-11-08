# KKS Tugas 2 VM hardening evidence

On 2026-11-08, Lynis 3.0.9 measured a hardening index of **71** on the dedicated VirtualBox guest `PrivateSession-KKS` (Ubuntu Server 24.04.5 LTS). The [original baseline](lynis-before.txt) scored **62**. The [final audit](lynis-after.txt) exceeds the required minimum of 70. Both files are byte-for-byte copies from the guest, verified with SHA-256. The baseline predates OpenSSH installation, so the comparison includes both setup and hardening changes.

| Pass | Score | Changes or checks |
| --- | ---: | --- |
| Original baseline | 62 | Initial VM audit; `FIRE-4512` reported no active firewall rules. |
| Initial hardening | 63 | Configured key-only SSH, enabled UFW, and applied guest package updates. |
| SSH refinements | 67 | Restricted unused SSH features, lowered authentication and session limits, and enabled verbose SSH logging. |
| Integrity and audit | 69 | Ran `debsums` without reported discrepancies and loaded audit rules for writes and attribute changes to SSH configuration. |
| Process and package accounting | 69 | Enabled process accounting and checked installed package versions. |
| Kernel protections | 71 | Restricted privileged core dumps and exposed kernel pointers, protected shared named pipes, enabled logging for invalid IPv4 source addresses, and disabled unnecessary IPv4 redirects and source routing. |

These controls address [R-02 in the Tugas 1 risk register](../risk-register.md), which calls for host OS hardening and before/after Lynis evidence. Package checks complement R-01; they do not replace container image scans.

| Final check | Observed result |
| --- | --- |
| Fresh SSH key login as `vboxuser` | Succeeded via Windows `127.0.0.1:2222` to guest TCP `22`. |
| Password-only SSH login | Rejected with `Permission denied (publickey)`. No password attempted. |
| Root SSH login | Rejected; `sshd -T` reported `permitrootlogin no`. |
| Other effective SSH settings | `pubkeyauthentication yes`, `passwordauthentication no`, `kbdinteractiveauthentication no`, and `allowtcpforwarding yes`. SSH tunneling is retained for this lab. |
| Guest firewall | UFW active; incoming denied by default, outgoing allowed, and TCP `22` permitted. VirtualBox binds the forwarding rule to Windows loopback. The final audit no longer reports `FIRE-4512`. |
| Audit and accounting | `auditd.service` and `acct.service` active; `auditctl -l` confirmed SSH configuration watches. |

The VM drop-ins are `/etc/ssh/sshd_config.d/00-kks-hardening.conf`, `/etc/audit/rules.d/50-kks-ssh.rules`, and `/etc/sysctl.d/99-z-kks-hardening.conf`. The container runtime controls, image scans, and SBOM require separate evidence.
