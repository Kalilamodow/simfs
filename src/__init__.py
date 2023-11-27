from classes import Path, Directory, File, str_path


class SimulatedFilesystem:
    '''
The main Simulated Filesystem class. `root` is the root Directory for all Files/Directories.
`cwd` is a basic Path object and will be prepended to any non-root paths provided to `get()`.
To change `cwd`, use the `.go` method on it.

`validate_directory_tree`: Checks if a directory exists
    '''
    root: Directory
    cwd: Path

    def __init__(self):
        self.cwd = Path('/')
        self.root = Directory('/')

    def valid_directory_tree(self, path: Path | str) -> bool | Directory:
        '''Validates a directory tree. If valid, return the end directory.'''
        path = str_path(path)
        if not path.sroot:
            path.prepend(self.cwd)

        pathAsList = list(path)
        if path.cType != 'dir':
            pathAsList = pathAsList[:-1]
        cdir = self.root
        for idx, pathPart in enumerate(pathAsList[1:]):
            if idx == len(pathAsList) - 1:
                pathPart.removesuffix('/')

            if not cdir.exists(pathPart + '/'):
                return False

            cdir = cdir.get(pathPart + '/')
        return cdir

    def get(self, path: Path | str) -> File | Directory | None:
        '''Gets a file by `path`.
        If `path` is not a root path, prepends `self.cwd`.'''
        path = str_path(path)

        if not path.sroot:
            path = Path(str(self.cwd) + str(path))

        # TODO: Implement get() method (validate dir tree, return the Directory/File)
        if not (pDir := self.valid_directory_tree(path)):
            return None

        return pDir.get(path[-1])
