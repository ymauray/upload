package fr.skym.upload

import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.multipart.support.StandardMultipartHttpServletRequest

@RestController
class UploadController {

    @RequestMapping(value = "/upload")
    def upload(MultipartFile file, String fileName, String fileType, Long fileSize, Integer offset, Long chunkSize, String filePath) {
        def tempFile = (offset == 0) ? File.createTempFile("mnupload", "tmp") : new File(filePath)
        def lengthBefore = tempFile.length()
        def is = file.inputStream
        def buffer = new byte[chunkSize]
        def n = is.read(buffer)
        is.close()
        def os = new FileOutputStream(tempFile, true)
        os.write(buffer, 0, n);
        os.flush();
        os.close()

        def lengthAfter = tempFile.length()
        def ok = (lengthAfter - lengthBefore - chunkSize) == 0L
        return [path: tempFile.absolutePath, length: lengthAfter, offset: offset, ok: ok]
    }

}
