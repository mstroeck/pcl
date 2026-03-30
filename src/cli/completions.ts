/**
 * Generate shell completions for various shells
 */

export function generateBashCompletions(): string {
  return `# pcl bash completion

_pcl_completions() {
  local cur prev opts commands
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  commands="plan init cache doctor config"

  # Main commands
  if [ $COMP_CWORD -eq 1 ]; then
    COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
    return 0
  fi

  # Options for 'plan' command
  if [ "\${COMP_WORDS[1]}" = "plan" ]; then
    opts="--models --context --depth --json --markdown --output-format --output --post --github-token --estimate --max-cost --verbose --timeout --repo --research --research-provider --research-model --no-cache --profile"

    case "$prev" in
      --depth)
        COMPREPLY=( $(compgen -W "high-level detailed implementation" -- "$cur") )
        return 0
        ;;
      --output-format)
        COMPREPLY=( $(compgen -W "terminal markdown json mermaid html" -- "$cur") )
        return 0
        ;;
      --profile)
        COMPREPLY=( $(compgen -W "fast thorough" -- "$cur") )
        return 0
        ;;
      --research-provider)
        COMPREPLY=( $(compgen -W "perplexity openai-compat" -- "$cur") )
        return 0
        ;;
      *)
        COMPREPLY=( $(compgen -W "$opts" -- "$cur") )
        return 0
        ;;
    esac
  fi

  # Options for 'cache' command
  if [ "\${COMP_WORDS[1]}" = "cache" ]; then
    COMPREPLY=( $(compgen -W "clear stats" -- "$cur") )
    return 0
  fi
}

complete -F _pcl_completions pcl
`;
}

export function generateZshCompletions(): string {
  return `#compdef pcl

_pcl() {
  local -a commands
  commands=(
    'plan:Create a plan for a task, feature, or issue'
    'init:Initialize Plan Council configuration'
    'cache:Manage response cache'
    'doctor:Validate API keys and test provider connectivity'
    'config:Show resolved configuration'
  )

  local -a plan_options
  plan_options=(
    '--models[Comma-separated models to use]:models:'
    '--context[Additional codebase/project context]:context:'
    '--depth[Planning depth]:depth:(high-level detailed implementation)'
    '--json[Output as JSON]'
    '--markdown[Output as Markdown]'
    '--output-format[Output format]:format:(terminal markdown json mermaid html)'
    '--output[Write output to file]:file:_files'
    '--post[Post as GitHub issue comment]'
    '--github-token[GitHub token]:token:'
    '--estimate[Estimate cost without running]'
    '--max-cost[Maximum cost budget]:cost:'
    '--verbose[Show all model responses]'
    '--timeout[Timeout per model in seconds]:seconds:'
    '--repo[Repository context]:repo:'
    '--research[Enable domain research]'
    '--research-provider[Research provider]:provider:(perplexity openai-compat)'
    '--research-model[Model to use for research]:model:'
    '--no-cache[Disable response caching]'
    '--profile[Config profile]:profile:(fast thorough)'
  )

  _arguments -C \\
    '1: :->command' \\
    '*::arg:->args'

  case $state in
    command)
      _describe 'command' commands
      ;;
    args)
      case $words[1] in
        plan)
          _arguments $plan_options
          ;;
        cache)
          _arguments '1: :(clear stats)'
          ;;
      esac
      ;;
  esac
}

_pcl "$@"
`;
}

export function generateFishCompletions(): string {
  return `# pcl fish completion

# Commands
complete -c pcl -f -n "__fish_use_subcommand" -a "plan" -d "Create a plan for a task, feature, or issue"
complete -c pcl -f -n "__fish_use_subcommand" -a "init" -d "Initialize Plan Council configuration"
complete -c pcl -f -n "__fish_use_subcommand" -a "cache" -d "Manage response cache"
complete -c pcl -f -n "__fish_use_subcommand" -a "doctor" -d "Validate API keys and test provider connectivity"
complete -c pcl -f -n "__fish_use_subcommand" -a "config" -d "Show resolved configuration"

# Options for 'plan' command
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l models -d "Comma-separated models to use"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l context -d "Additional codebase/project context"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l depth -a "high-level detailed implementation" -d "Planning depth"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l json -d "Output as JSON"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l markdown -d "Output as Markdown"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l output-format -a "terminal markdown json mermaid html" -d "Output format"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l output -d "Write output to file"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l post -d "Post as GitHub issue comment"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l github-token -d "GitHub token"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l estimate -d "Estimate cost without running"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l max-cost -d "Maximum cost budget"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l verbose -d "Show all model responses"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l timeout -d "Timeout per model in seconds"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l repo -d "Repository context"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l research -d "Enable domain research"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l research-provider -a "perplexity openai-compat" -d "Research provider"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l research-model -d "Model to use for research"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l no-cache -d "Disable response caching"
complete -c pcl -f -n "__fish_seen_subcommand_from plan" -l profile -a "fast thorough" -d "Config profile"

# Options for 'cache' command
complete -c pcl -f -n "__fish_seen_subcommand_from cache" -a "clear" -d "Clear cache"
complete -c pcl -f -n "__fish_seen_subcommand_from cache" -a "stats" -d "Show cache statistics"
`;
}
