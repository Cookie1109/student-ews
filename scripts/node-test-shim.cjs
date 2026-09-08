// Some restricted Windows runtimes deny uv_os_get_passwd. tsx only needs a
// stable identifier for its temporary directory, so provide the POSIX branch.
if (typeof process.geteuid !== "function") {
  process.geteuid = () => 0;
}
