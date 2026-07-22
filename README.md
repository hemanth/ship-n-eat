# ship-n-eat

Order food when you ship code. GitHub Action that celebrates repo milestones via DoorDash.

```yaml
- uses: hemanth/ship-n-eat@v1
  with:
    dd-cli-token: ${{ secrets.DD_CLI_TOKEN }}
```

## Quick start

Add `.github/ship-n-eat.yml` to your repo:

```yaml
restaurants:
  - store_id: "12345"
    name: "Pizza Place"
    items: ["Large Cheese Pizza", "Garlic Bread"]
  - store_id: "67890"
    name: "Taco Joint"
    random_items: 3

budget: 40
dietary: veg

occasions:
  first_pr_merged:
    enabled: true
  release:
    enabled: true
    budget: 60
  pr_milestone:
    counts: [10, 50, 100, 500]
```

Add a workflow (`.github/workflows/celebrate.yml`):

```yaml
name: celebrate
on:
  pull_request:
    types: [closed]
  release:
    types: [published]
  issues:
    types: [closed]

jobs:
  eat:
    if: github.event.pull_request.merged == true || github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: hemanth/ship-n-eat@v1
        with:
          dd-cli-token: ${{ secrets.DD_CLI_TOKEN }}
```

Merge a PR, ship a release, close an issue - food shows up.

## Auth

Two ways to authenticate:

```yaml
# Option 1: Token (grab from keychain, expires ~3 days)
dd-cli-token: ${{ secrets.DD_CLI_TOKEN }}

# Option 2: Email + password (auto-refreshes)
dd-cli-email: ${{ secrets.DD_CLI_EMAIL }}
dd-cli-password: ${{ secrets.DD_CLI_PASSWORD }}
```

Get your token locally:

```bash
security find-generic-password -s "dd-cli" -w   # macOS
```

## Occasions

```yaml
occasions:
  first_pr_merged:     # first PR ever merged
    enabled: true
    message: "First PR by {author}! Ordering {restaurant}."
  pr_milestone:        # Nth PR merged
    counts: [10, 50, 100, 500, 1000]
  first_issue_closed:  # first issue squashed
    enabled: true
  issue_milestone:     # Nth issue closed
    counts: [100, 500, 1000]
    enabled: false
  release:             # any release
    enabled: true
    budget: 60
  major_release:       # semver major bump
    budget: 80
  first_release:       # first release ever
    enabled: true
  star_milestone:      # star count milestones
    counts: [100, 500, 1000, 5000]
    enabled: false
  custom_label:        # label trigger
    label: celebrate
    enabled: false
```

Each occasion can override `budget`, `message`, and `restaurant`.

## Restaurant selection

```yaml
restaurants:
  - store_id: "12345"
    name: "Pizza Place"
    items: ["Large Cheese Pizza"]   # specific items
    weight: 2                       # 2x more likely when random
  - store_id: "67890"
    name: "Sushi Spot"
    random_items: 3                 # pick 3 random from menu
    weight: 1

selection: random          # random | round-robin | first
dietary: veg               # all | veg | vegan | gluten-free | dairy-free
budget: 40                 # USD cap per order
```

`selection: random` picks a restaurant weighted by `weight`. `round-robin` cycles through the list. `first` always picks the first.

## Dry run

```yaml
- uses: hemanth/ship-n-eat@v1
  with:
    dd-cli-token: ${{ secrets.DD_CLI_TOKEN }}
    dry-run: 'true'
```

Previews the order without placing it. Useful for testing.

## What gets posted

When an occasion triggers, a comment is posted on the PR/issue/release:

```
ship-n-eat: First PR merged!

Ordered from Pizza Place:
  - Large Cheese Pizza ($12.99)
  - Garlic Bread ($5.49)

Total: $18.48
```

## Inputs

- `dd-cli-token` - DoorDash CLI token JSON
- `dd-cli-email` - DoorDash email (with password, auto-refreshes)
- `dd-cli-password` - DoorDash password
- `config-path` - config file path (default: `.github/ship-n-eat.yml`)
- `dry-run` - preview without ordering (default: `false`)

## License

MIT © [Hemanth.HM](https://h3manth.com)
