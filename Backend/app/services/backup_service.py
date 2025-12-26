# import subprocess
# import os
# import hashlib
# from datetime import datetime
# import pymssql # Ensure this is installed: pip install pymssql

# class BackupService:
#     @staticmethod
#     def run_pg_dump(conn_details: dict, output_path: str, backup_type: str, format: str):
#         """
#         Executes PostgreSQL dump logic
#         """
#         env = os.environ.copy()
#         env["PGPASSWORD"] = conn_details['password']

#         cmd = [
#             "pg_dump",
#             "-h", conn_details['host'],
#             "-p", str(conn_details['port']),
#             "-U", conn_details['username'],
#             "-d", conn_details['database_name']
#         ]

#         if format == "dump":
#             cmd.extend(["-Fc"]) 
#         elif format == "sql":
#             cmd.extend(["-Fp"])

#         if backup_type == "schema":
#             cmd.append("-s")
            
#         with open(output_path, "wb") as f:
#             process = subprocess.run(
#                 cmd, 
#                 env=env, 
#                 stdout=f, 
#                 stderr=subprocess.PIPE, 
#                 text=True
#             )
            
#         if process.returncode != 0:
#             raise Exception(f"pg_dump failed: {process.stderr}")

#         return BackupService._generate_checksum(output_path)

#     @staticmethod
#     def run_mssql_backup(conn_details: dict, output_path: str):
#         """
#         Lightweight SQL Server Backup for Shared Hosting (Site4Now).
#         Bypasses 'Query Governor' cost limits by manually scripting data.
#         """
#         try:
#             # 1. Establish a standard database connection
#             conn = pymssql.connect(
#                 server=conn_details['host'],
#                 port=conn_details['port'],
#                 user=conn_details['username'],
#                 password=conn_details['password'],
#                 database=conn_details['database_name'],
#                 login_timeout=10
#             )
#             cursor = conn.cursor(as_dict=True)

#             # 2. Open file for writing the SQL script
#             with open(output_path, "w", encoding="utf-8") as f:
#                 f.write(f"-- SQL Server Lightweight Backup\n")
#                 f.write(f"-- Database: {conn_details['database_name']}\n")
#                 f.write(f"-- Generated: {datetime.now()}\n\n")

#                 # 3. Get all user tables (Low-cost metadata query)
#                 cursor.execute("""
#                     SELECT TABLE_NAME 
#                     FROM INFORMATION_SCHEMA.TABLES 
#                     WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = %s
#                 """, (conn_details['database_name'],))
                
#                 tables = [row['TABLE_NAME'] for row in cursor.fetchall()]

#                 for table in tables:
#                     print(f"DEBUG: Scripting data for table: {table}")
#                     f.write(f"\n-- Data for table: {table}\n")
                    
#                     # 4. Fetch data using a simple SELECT (Low-cost)
#                     cursor.execute(f"SELECT * FROM [{table}]")
#                     rows = cursor.fetchall()
                    
#                     if not rows:
#                         continue

#                     # 5. Build the INSERT statements manually
#                     columns = rows[0].keys()
#                     col_names = ", ".join([f"[{c}]" for c in columns])
                    
#                     for row in rows:
#                         values = []
#                         for col in columns:
#                             val = row[col]
#                             if val is None:
#                                 values.append("NULL")
#                             elif isinstance(val, (int, float, bool)):
#                                 values.append(str(int(val) if isinstance(val, bool) else val))
#                             else:
#                                 # Escape single quotes for strings to prevent SQL errors
#                                 clean_val = str(val).replace("'", "''")
#                                 values.append(f"N'{clean_val}'")
                        
#                         f.write(f"INSERT INTO [{table}] ({col_names}) VALUES ({', '.join(values)});\n")

#             conn.close()
#             # 6. Generate checksum using original logic
#             return BackupService._generate_checksum(output_path)

#         except Exception as e:
#             # Cleanup file if failed
#             if os.path.exists(output_path):
#                 os.remove(output_path)
#             raise Exception(f"Lightweight MSSQL Backup Failed: {str(e)}")

#     @staticmethod
#     def _generate_checksum(file_path):
#         sha256_hash = hashlib.sha256()
#         with open(file_path, "rb") as f:
#             for byte_block in iter(lambda: f.read(4096), b""):
#                 sha256_hash.update(byte_block)
#         return sha256_hash.hexdigest()


import subprocess
import os
import hashlib
from datetime import datetime
import platform
import pymssql 

class BackupService:
    @staticmethod
    def _get_pg_dump_path():
        """
        Helper to find the best pg_dump binary.
        Prioritizes newer versions on macOS Homebrew.
        """
        if platform.system() == "Darwin":  # macOS
            # Common Homebrew paths for newer PostgreSQL versions
            paths = [
                "/opt/homebrew/opt/postgresql@18/bin/pg_dump",
                "/opt/homebrew/opt/postgresql@17/bin/pg_dump",
                "/opt/homebrew/opt/postgresql@16/bin/pg_dump",
                "/opt/homebrew/bin/pg_dump", # Latest symlink
                "/usr/local/bin/pg_dump"     # Intel Mac path
            ]
            for path in paths:
                if os.path.exists(path):
                    return path
        
        # Fallback for Windows/Linux or if no Homebrew path found
        return "pg_dump"

    @staticmethod
    def run_pg_dump(conn_details: dict, output_path: str, backup_type: str, format: str):
        """
        Executes PostgreSQL dump logic using the best available pg_dump binary.
        """
        env = os.environ.copy()
        env["PGPASSWORD"] = conn_details['password']

        pg_dump_bin = BackupService._get_pg_dump_path()

        cmd = [
            pg_dump_bin,
            "-h", conn_details['host'],
            "-p", str(conn_details['port']),
            "-U", conn_details['username'],
            "-d", conn_details['database_name']
        ]

        # Use -w to ensure it doesn't prompt for password (uses env instead)
        cmd.append("-w")

        if format == "dump":
            cmd.extend(["-Fc"]) 
        elif format == "sql":
            cmd.extend(["-Fp"])

        if backup_type == "schema":
            cmd.append("-s")
            
        with open(output_path, "wb") as f:
            process = subprocess.run(
                cmd, 
                env=env, 
                stdout=f, 
                stderr=subprocess.PIPE, 
                text=True
            )
            
        if process.returncode != 0:
            # Check if it's still a version mismatch error to give a better hint
            if "version mismatch" in process.stderr:
                raise Exception(f"Postgres Version Mismatch: Your local pg_dump is too old. "
                                f"Please run 'brew install postgresql@18' on your Mac. "
                                f"Details: {process.stderr}")
            raise Exception(f"pg_dump failed: {process.stderr}")

        return BackupService._generate_checksum(output_path)

    @staticmethod
    def run_mssql_backup(conn_details: dict, output_path: str):
        """
        Lightweight SQL Server Backup for Shared Hosting (Site4Now).
        Bypasses 'Query Governor' cost limits by manually scripting data.
        """
        try:
            conn = pymssql.connect(
                server=conn_details['host'],
                port=conn_details['port'],
                user=conn_details['username'],
                password=conn_details['password'],
                database=conn_details['database_name'],
                login_timeout=15
            )
            cursor = conn.cursor(as_dict=True)

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(f"-- SQL Server Lightweight Backup\n")
                f.write(f"-- Database: {conn_details['database_name']}\n")
                f.write(f"-- Generated: {datetime.now()}\n\n")

                cursor.execute("""
                    SELECT TABLE_NAME 
                    FROM INFORMATION_SCHEMA.TABLES 
                    WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = %s
                """, (conn_details['database_name'],))
                
                tables = [row['TABLE_NAME'] for row in cursor.fetchall()]

                for table in tables:
                    print(f"DEBUG: Scripting table: {table}")
                    f.write(f"\n-- Data for table: {table}\n")
                    
                    cursor.execute(f"SELECT * FROM [{table}]")
                    rows = cursor.fetchall()
                    
                    if not rows:
                        continue

                    columns = rows[0].keys()
                    col_names = ", ".join([f"[{c}]" for c in columns])
                    
                    for row in rows:
                        values = []
                        for col in columns:
                            val = row[col]
                            if val is None:
                                values.append("NULL")
                            elif isinstance(val, (int, float, bool)):
                                values.append(str(int(val) if isinstance(val, bool) else val))
                            else:
                                clean_val = str(val).replace("'", "''")
                                values.append(f"N'{clean_val}'")
                        
                        f.write(f"INSERT INTO [{table}] ({col_names}) VALUES ({', '.join(values)});\n")

            conn.close()
            return BackupService._generate_checksum(output_path)

        except Exception as e:
            if os.path.exists(output_path):
                os.remove(output_path)
            raise Exception(f"Lightweight MSSQL Backup Failed: {str(e)}")

    @staticmethod
    def _generate_checksum(file_path):
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()