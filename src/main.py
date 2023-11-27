from classes import Path, Directory


class SimulatedFilesystem:
    root: Directory
    cwd: Path

    def __init__(self):
        self.cwd = Path('/')
        self.root = Directory('/')

    def get(self, path: Path|str):
        # path path path path path
        if not isinstance(path, Path):
            path = Path(path)

        # TODO: Implement get() method (has to validate folder structure, return the Directory/File)
        if path.cType == 'dir':
            ...
        elif path.cType == 'file':
            ...
