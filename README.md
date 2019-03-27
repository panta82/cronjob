# Cronjob

A playground task.

Create a simplified cronjob runner.

It should be able to parse crontab file, where each line is a comment (starting with `#`) or a job specification, formatted like this:

```
<second> <minute> <hour> <command>
```

Second, minute and hour can be specified as:

1. Whole number, meaning the absolute value at which cron should fire ("17" means "fire when clock says "17").
2. Star (`*`), meaning the cron should fire every second/minute/hour.
3. "`*/x`" means the cron should fire every `x`-th second/minute/hour.

Example crontab:

```
# Crontab specification

# Sec   Min   Hour   Command
  *     *     *      echo "every second"
  */3   *     *      echo "every third second"
  */5   *     *      echo "every fifth second"
  0     *     *      echo "every minute at 0 sec"
  */5   30    *      echo "every 5 seconds, once per hour, during the 30th minute"
  15    18    12     echo "every day at 12:18:15"
  */30   0    *      echo "every hour twice during the first minute"
```

If user alters the crontab file, cronjob runner should auto-update.

Runner should gracefully handle errors from executed commands.
