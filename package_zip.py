import os
import zipfile
import shutil

def package_project():
    source_dir = r"c:\Users\katak\OneDrive\Desktop\ArtefactAnalyser\Smart-Pet-Tracking-System"
    output_zip_workspace = r"c:\Users\katak\OneDrive\Desktop\ArtefactAnalyser\Smart-Pet-Tracking-System.zip"
    artifact_dir = r"C:\Users\katak\.gemini\antigravity-ide\brain\577068d1-fe94-4be9-9014-4b20561c3b93"
    output_zip_artifact = os.path.join(artifact_dir, "Smart-Pet-Tracking-System.zip")

    # Folders and file patterns to strictly exclude
    excluded_dirs = {
        "node_modules",
        "venv",
        "env",
        "__pycache__",
        ".pytest_cache",
        "dist",
        ".git",
    }
    
    excluded_files = {
        ".env",            # Exclude real credentials file (.env.example is included)
        "desktop.ini",
        ".DS_Store",
    }

    print(f"[*] Packaging {source_dir} -> {output_zip_workspace} ...")

    file_count = 0
    total_bytes = 0

    with zipfile.ZipFile(output_zip_workspace, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in excluded_dirs and not d.endswith(".egg-info")]

            for file in files:
                if file in excluded_files or file.endswith(".pyc") or file.endswith(".log"):
                    continue

                full_path = os.path.join(root, file)
                # Relative path inside the zip file
                rel_path = os.path.relpath(full_path, os.path.dirname(source_dir))
                
                zipf.write(full_path, rel_path)
                file_count += 1
                total_bytes += os.path.getsize(full_path)

    zip_size_mb = os.path.getsize(output_zip_workspace) / (1024 * 1024)
    print(f"[SUCCESS] Created workspace ZIP: {output_zip_workspace}")
    print(f"  Total Files Included: {file_count}")
    print(f"  Uncompressed Content: {total_bytes / (1024 * 1024):.2f} MB")
    print(f"  Compressed ZIP Size:  {zip_size_mb:.2f} MB")

    # Also copy to artifact directory for UI download link
    shutil.copy2(output_zip_workspace, output_zip_artifact)
    print(f"[SUCCESS] Copied to Artifacts: {output_zip_artifact}")

if __name__ == "__main__":
    package_project()
