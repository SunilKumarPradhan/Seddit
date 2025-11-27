import os

# Set your target directory here
MAIN_PATH = r"backend"

# Folders to completely ignore
IGNORE_FOLDERS = {
    ".git",
    ".vscode", 
    "node_modules",      # Massive folder, not needed
    "dist",              # Build output
    "build",             # Build output
    ".angular",          # Angular cache
    "coverage",          # Test coverage reports
    ".idea",             # JetBrains IDE
    ".vs",               # Visual Studio
    "__pycache__",       # Python cache
    ".pytest_cache",     # Pytest cache
}

# Files to ignore by exact name
IGNORE_FILES = {
    "curr_dir.txt",      # Our output file
    "package-lock.json", # Huge file, package.json is enough
    ".DS_Store",         # Mac OS
    "thumbs.db",         # Windows
    ".editorconfig",     # Editor config
    ".gitignore",        # Git config
}

# Extensions to ignore
IGNORE_EXTENSIONS = {
    ".map",              # Source maps
    ".log",              # Log files
    ".lock",             # Lock files
    ".jpg", ".jpeg", ".png", ".gif", ".ico", ".svg",  # Images (optional)
    ".woff", ".woff2", ".ttf", ".eot",  # Fonts (optional)
}

# Extensions to INCLUDE (whitelist approach for clarity)
INCLUDE_EXTENSIONS = {
    # TypeScript/JavaScript
    ".ts",               # TypeScript source
    ".js",               # JavaScript (only if needed, e.g., config files)
    
    # Templates & Styles
    ".html",             # Angular templates
    ".css",              # Styles
    ".scss",             # SASS styles
    
    # Configuration
    ".json",             # Config files
    ".md",               # Documentation
}

def should_include_file(file_name, file_path):
    """
    Determine if a file should be included based on:
    1. Exact name ignore list
    2. Extension ignore list
    3. Extension include list (whitelist)
    """
    
    # Check exact filename ignores
    if file_name in IGNORE_FILES:
        return False
    
    # Get extension
    _, ext = os.path.splitext(file_name)
    ext_lower = ext.lower()
    
    # Check extension ignores
    if ext_lower in IGNORE_EXTENSIONS:
        return False
    
    # Whitelist: only include specific extensions
    if ext_lower in INCLUDE_EXTENSIONS:
        return True
    
    # For files without extension or unlisted extensions
    # Include if they're important config files
    important_files = {
        "Dockerfile", 
        "docker-compose.yml",
        ".env.example",
        "README"
    }
    
    if file_name in important_files:
        return True
    
    return False


def get_relative_path(file_path, root_dir):
    """Get clean relative path with forward slashes"""
    rel_path = os.path.relpath(file_path, root_dir)
    # Convert to forward slashes for consistency
    return rel_path.replace(os.sep, '/')


def write_directory_contents(root_dir):
    """
    Create a comprehensive text file with:
    1. Directory tree structure
    2. File contents
    """
    
    if not os.path.exists(root_dir):
        print(f"❌ Directory not found: {root_dir}")
        return
    
    output_file = os.path.join(root_dir, "curr_dir.txt")
    
    # Collect all files first
    all_files = []
    
    for folder, subdirs, files in os.walk(root_dir):
        # Remove ignored folders from traversal (in-place modification)
        subdirs[:] = [d for d in subdirs if d not in IGNORE_FOLDERS]
        
        for file in files:
            if should_include_file(file, os.path.join(folder, file)):
                file_path = os.path.join(folder, file)
                all_files.append(file_path)
    
    # Sort files for consistent output
    all_files.sort()
    
    print(f"📊 Found {len(all_files)} files to include")
    
    with open(output_file, "w", encoding="utf-8") as out:
        
        # === PART 1: DIRECTORY TREE ===
        out.write("=" * 80 + "\n")
        out.write("DIRECTORY TREE STRUCTURE\n")
        out.write("=" * 80 + "\n\n")
        
        for folder, subdirs, files in os.walk(root_dir):
            # Remove ignored folders
            subdirs[:] = [d for d in subdirs if d not in IGNORE_FOLDERS]
            subdirs.sort()  # Sort for consistent output
            
            # Calculate indentation level
            level = folder.replace(root_dir, '').count(os.sep)
            indent = '│   ' * level
            
            folder_name = os.path.basename(folder) or os.path.basename(root_dir)
            out.write(f"{indent}📁 {folder_name}/\n")
            
            # Sub-indent for files
            sub_indent = '│   ' * (level + 1)
            
            # Filter and sort files
            included_files = [f for f in files if should_include_file(f, os.path.join(folder, f))]
            included_files.sort()
            
            for file in included_files:
                # Choose icon based on extension
                icon = "📄"
                if file.endswith('.ts'):
                    icon = "📘"
                elif file.endswith('.html'):
                    icon = "🌐"
                elif file.endswith(('.css', '.scss')):
                    icon = "🎨"
                elif file.endswith('.json'):
                    icon = "⚙️"
                elif file.endswith('.md'):
                    icon = "📝"
                
                out.write(f"{sub_indent}{icon} {file}\n")
        
        # === PART 2: FILE CONTENTS ===
        out.write("\n\n")
        out.write("=" * 80 + "\n")
        out.write("FILE CONTENTS\n")
        out.write("=" * 80 + "\n\n")
        
        for file_path in all_files:
            rel_path = get_relative_path(file_path, root_dir)
            
            out.write("\n" + "-" * 80 + "\n")
            out.write(f"FILE: {rel_path}\n")
            out.write("-" * 80 + "\n")
            
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # If file is empty, note it
                if not content.strip():
                    out.write("[EMPTY FILE]\n")
                else:
                    out.write(content)
                    # Ensure newline at end
                    if not content.endswith('\n'):
                        out.write('\n')
                        
            except UnicodeDecodeError:
                out.write("[BINARY FILE - Cannot display contents]\n")
            except Exception as e:
                out.write(f"[ERROR READING FILE: {e}]\n")
        
        # === PART 3: SUMMARY ===
        out.write("\n\n")
        out.write("=" * 80 + "\n")
        out.write("SUMMARY\n")
        out.write("=" * 80 + "\n")
        out.write(f"Total files included: {len(all_files)}\n")
        
        # Count by extension
        ext_counts = {}
        for fp in all_files:
            ext = os.path.splitext(fp)[1] or "[no extension]"
            ext_counts[ext] = ext_counts.get(ext, 0) + 1
        
        out.write("\nFile types:\n")
        for ext, count in sorted(ext_counts.items(), key=lambda x: x[1], reverse=True):
            out.write(f"  {ext}: {count}\n")
    
    print(f"✅ Directory summary saved to: {output_file}")
    print(f"📁 Total size: {os.path.getsize(output_file) / 1024:.2f} KB")


def main():
    if not MAIN_PATH:
        print("❌ Please set MAIN_PATH variable to a valid directory path.")
        return
    
    print(f"🔍 Scanning: {MAIN_PATH}")
    print(f"📝 Ignoring folders: {', '.join(IGNORE_FOLDERS)}")
    print(f"✅ Including extensions: {', '.join(INCLUDE_EXTENSIONS)}")
    print("-" * 80)
    
    write_directory_contents(MAIN_PATH)


if __name__ == "__main__":
    main()