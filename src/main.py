from classes import Path, Directory


class SimulatedFilesystem:
    root: Directory
    cwd: Path

    def __init__(self):
        self.cwd = Path('/')
        self.root = Directory('/')


    def validate_directory_tree(self, path: Path|str):
        # TODO: implement
        raise NotImplementedError

    def get(self, path: Path|str):
        # path path path path path
        if not isinstance(path, Path):
            path = Path(path)

        # TODO: Implement get() method (validate dir tree, return the Directory/File)
        if path.cType == 'dir':
            ...
        elif path.cType == 'file':
            ...
