
# TODOs
- [x] Suspend Backups / Jobs
- [x] Can we recover from backup?
- [x] In the event of accidental deletion, mark a database as seeded from scheduled back
- [x] Migrate the workload to another node
- [x] If a node is cordoned / drained for service what happens to the workload?
- [x] Cluster addressing, what is this servers address?  How do other clients connect?
- [x] Is addressing any different inside of the same namespace?
- [x] Connecting to the server from another an app on another node

- [] Is it possible to have the workloads rollover as hosts go up and down?
    For the most part, this probably isn't needed -- since most services can afford to be out of service briefly in exchange for the ease of managing services this way
- [] probably a later thing, but operating active/active services or active passive clones.  
    Most workloads probably won't need this given the complexity tradeoff


# Recovery Patterns


# cluster Addressing
http://helloworldsvc
http://helloworldsvc.default
http://helloworldsvc.default.svc
http://helloworldsvc.default.svc.cluster.local
http://helloworldsvc.default.svc.cluster.local:80

This appears to work even in cases where the client and the server are on different nodes.  




# Migrading the workload to another node
would either require manual database restores , or using different volume models
in the example I worked, I:
- Cordoned off the node
- Drained node with some force
- SShed to node, and performed updates
- Uncordoned
During this time, the machine sat pending b/c it was bound to the PVC that was a local host path.  Otherwise it probably would have created it from scratch on another node


# Suspending a backup
in k9s, a job can be temporarily suspended 
typing `E` to enter edit mode
editing `spec>schedule>suspend == true`

# Suspending a SqlJob
in k9s, a job can be temporarily suspended 
typing `E` to enter edit mode
editing `spec>schedule>suspend == true`

# Recovering from a backup

## Before the backup
```
| 2955 | 2024-03-28 01:57:00 |
| 2956 | 2024-03-28 01:58:00 |
| 2957 | 2024-03-28 01:59:00 |
| 2958 | 2024-03-28 02:00:00 |
| 2959 | 2024-03-28 02:01:00 |
| 2960 | 2024-03-28 02:02:00 |
| 2961 | 2024-03-28 02:03:00 |
| 2962 | 2024-03-28 02:04:00 |
| 2963 | 2024-03-28 02:05:00 |
| 2964 | 2024-03-28 02:06:00 |
| 2965 | 2024-03-28 02:07:00 |
| 2966 | 2024-03-28 02:08:00 |
+------+---------------------+
```

Command
`kubectl apply -f ./kubernetes/apps/default/dbtest/app/recovery.yaml `

## After the backup
```
| 187 | 2024-03-26 03:49:00 |
| 188 | 2024-03-26 03:50:00 |
| 189 | 2024-03-26 03:51:00 |
| 190 | 2024-03-26 03:52:00 |
| 191 | 2024-03-26 03:53:00 |
| 192 | 2024-03-26 03:54:00 |
| 193 | 2024-03-26 03:55:00 |
+-----+---------------------+
```

In the case of recovering from an accidental deletion:
 `kubectl apply -f ./kubernetes/apps/default/dbtest/app/recover\ server\ from\ backup.yaml`