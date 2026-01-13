# PAGIA CLI Alias (Fixed Absolute Path)
# Add this to your PowerShell profile ($PROFILE)
function Invoke-PAGIA {
    param(
        [Parameter(ValueFromRemainingArguments=$true)]
        [string[]]$Arguments
    )
    
    # Use absolute path to ensure it works from any directory
    $projectRoot = "C:/projetos2025/PAGIA"
    $entryPoint = "$projectRoot/apps/backend/src/index.ts"
    
    $command = "npx tsx '$entryPoint'"
    if ($Arguments) {
        $command += " " + ($Arguments -join " ")
    }
    
    Invoke-Expression $command
}

# Create alias
Set-Alias -Name pagia -Value Invoke-PAGIA

# Usage examples:
# pagia --version
# pagia --help
# pagia chat