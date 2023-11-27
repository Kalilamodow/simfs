from __future__ import annotations
from exceptions import InvalidFilenameError


INVALID_FILE_CHARS = ['/', '\\', '|', '?', ':', '*', '<', '>', '"']


class Path:
    __list: list[str]
    __str: str
    cType: str


    def __init__(self, path: str | list = '/') -> None:
        if isinstance(path, str):
            l = path.split('/')
            if len(l) <= 2:
                l = ['/']
        else:
            l = path

        l = self.remove_empty_from_list(l)
        self.__list = l

        asStr = '/'.join(l).replace('//', '/').replace('//', '/')
        self.__str = asStr

        if asStr.endswith('/'):
            self.cType = 'file'
        else:
            self.cType = 'directory'

    def remove_empty_from_list(self, l: list[str]) -> list[str]:
        res = []
        for idx, part in enumerate(l):
            if idx == 0 and part == '':
                res.append('/')
                continue

            if not part == '':
                res.append(part)
                continue

        if l[-1] == '':
            res[-1] += '/'
        return res

    def go(self, to: Path):
        cmdlist = list(to)
        cpath = self.__list.copy()

        for cmd in cmdlist:
            if cmd == '.':
                continue
            if cmd == '..':
                cpath = cpath[:-1]
                continue
            cpath.append(cmd)

        return Path(cpath)


    def __list__(self): return self.__list

    def __getitem__(self, n): return self.__list[n]

    def __iter__(self): return iter(self.__list)

    def __str__(self): return self.__str


class File:
    name: str
    path: str
    contents: bytes

    def __init__(self, path: Path, contents: bytes|None=None):
        name = path[-1]
        if any(x in name for x in INVALID_FILE_CHARS):
            raise InvalidFilenameError
        self.name = name
        self.contents = contents if contents is not None else ''.encode()


    def write(self, contents: bytes, append=False) -> None:
        if not append:
            self.contents = contents
            return
        self.contents += contents

    def read(self) -> bytes:
        return self.contents
    
    def __str__(self) -> str:
        return self.name


class Directory:
    name: str
    path: Path
    children: list[File|Directory]

    def __init__(self, path: Path|str):
        if isinstance(path, str):
            path = Path(path)

        self.path = path
        self.name = path[-1] + '/'
        self.children = []

    
    def files(self) -> list[File|Directory]:
        return [x.name for x in self.children]
    
    def create_file(self, fname: str, contents: bytes|None=None) -> File:
        # make sure doesn't exist already
        if fname in [n.name for n in self.children]:
            raise FileExistsError
        
        # ok then create
        fi = File(Path(str(self.path) + fname), contents)

        self.children.append(fi)
        return fi
    
    def create_dir(self, path: Path):
        name = path[-1]

        if name in [n.name for n in self.children]:
            raise FileExistsError
        
        ndir = Directory(path)
        self.children.append(ndir)
        return ndir
    
    def exists(self, name: str) -> bool:
        return name in [n.name for n in self.children]
